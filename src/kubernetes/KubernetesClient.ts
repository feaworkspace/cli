import * as k8s from '@kubernetes/client-node';
import { KubernetesObject } from "@kubernetes/client-node/dist/types";
import { V1Secret } from "@kubernetes/client-node";
import KubernetesWorkspace from './workspace/KubernetesWorkspace';
import * as yaml from "yaml";


export default class KubernetesClient {
  private readonly k8sApi: k8s.CoreV1Api;
  private readonly k8sObjectApi: k8s.KubernetesObjectApi;

  public constructor(public readonly namespace: string) {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.k8sObjectApi = k8s.KubernetesObjectApi.makeApiClient(kc);
  }

  public async deploy(workspace: KubernetesWorkspace, prune: boolean = false) {
    const previousState = JSON.parse((await this.getObject<k8s.V1ConfigMap>('v1', 'ConfigMap', workspace.name('state')))?.data?.['state'] || '[]');

    const resources = workspace.getResources();
    for (const resource of resources) {
      try {
        const existing = await this.getObject(resource.apiVersion!, resource.kind!, resource.metadata?.name!);
        if (existing) {
          try {
            await this.k8sObjectApi.replace(resource);
          } catch (e) {
            await this.k8sObjectApi.patch(resource);
          }
          console.log(`${resource.kind} ${resource.metadata?.name} updated`);
        } else {
          await this.k8sObjectApi.create(resource);
          console.log(`${resource.kind} ${resource.metadata?.name} created`);
        }
      } catch (e) {
        console.log(yaml.stringify(resource));
        throw e;
      }
    }

    if (prune) {
      for (const resource of previousState) {
        const existing = await this.getObject(resource.apiVersion, resource.kind, resource.metadata.name);
        if (existing && !resources.some(r => r.apiVersion === resource.apiVersion && r.kind === resource.kind && r.metadata?.name === resource.metadata.name)) {
          try {
            await this.k8sObjectApi.delete(resource);
            console.log(`${resource.kind} ${resource.metadata.name} deleted`);
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
  }

  public async workspaceExists() {
    return await this.try(this.k8sApi.readNamespace({
      name: this.namespace
    })) !== undefined;
  }

  public async getObject<T extends KubernetesObject>(apiVersion: string, kind: string, name: string): Promise<T | undefined> {
    if (kind === 'Namespace') {
      return this.try(this.k8sApi.readNamespace({ name })) as unknown as T;
    }
    return await this.try(this.k8sObjectApi.read({ apiVersion, kind, metadata: { name, namespace: this.namespace } })) as unknown as T;
  }

  public async getSecret(name: string): Promise<V1Secret | undefined> {
    return await this.try(this.getObject<k8s.V1Secret>('v1', 'Secret', name));
  }

  private async try<T>(resource: Promise<T>) {
    try {
      return await resource;
    } catch {
      return undefined;
    }
  }
}