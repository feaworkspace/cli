import * as z from 'zod';
import Settings from '../../Settings.json';

export interface WorkspaceIngressConfig {
  subdomain: string;
  path: string;
  auth: boolean;
}

export const workspaceIngressSchema = z.object({
  subdomain: z.string().default(''),
  path: z.string().default('/'),
  auth: z.boolean().default(true),
});

export interface WorkspacePortConfig {
  name: string;
  number: number;
  protocol: string;
  ingress?: WorkspaceIngressConfig;
}

export const workspacePortSchema = z.object({
  name: z.string(),
  number: z.number(),
  protocol: z.string().default('TCP'),
  ingress: workspaceIngressSchema.optional().nullable().transform((ingress) => {
    if (ingress === null) {
      return {
        subdomain: '',
        path: '/',
        auth: true
      };
    }
    return ingress;
  }),
});

export interface WorkspaceVolumeConfig {
  name: string;
  mountPath: string;
}

export const workspaceVolumeSchema = z.object({
  name: z.string(),
  mountPath: z.string(),
});

export interface WorkspaceComponentConfig {
  name: string;
  image: string;
  tag: string;
  command?: string[];
  args?: string[];
  ports: Array<WorkspacePortConfig>;
  env: Record<string, string>;
  secrets: Record<string, string>;
  volumes: Array<WorkspaceVolumeConfig>;
}

export const workspaceComponentSchema = z.object({
  name: z.string(),
  image: z.string(),
  tag: z.string().default('latest'),
  ports: z.array(workspacePortSchema).default([]),
  env: z.record(z.string()).default({}),
  secrets: z.record(z.string()).default({}),
  volumes: z.array(workspaceVolumeSchema).default([]),
});

export type WorkspaceIncludeConfig = {
  include: string;
  with?: any;
};

export const workspaceIncludeSchema = z.object({
  include: z.string(),
  with: z.any().default({})
});

export interface RepositoryConfig {
  url: string;
  path?: string;
  branch?: string;
}

export const workspaceRepositorySchema = z.object({
  url: z.string(),
  path: z.string().optional(),
  branch: z.string().optional(),
});

export interface WorkspaceGatewayConfig {
  name: string;
  image: string;
  tag: string;
  firebaseServiceAccountKey: string;
}

export const workspaceGatewaySchema = z.object({
  name: z.string().default('gateway'),
  image: z.string().default(Settings.gateway.image),
  tag: z.string().default(Settings.gateway.tag),
  firebaseServiceAccountKey: z.string(),
});

export interface WorkspaceScriptConfig {
  title: string;
  args: Record<string, string>;
  script: string;
}

export const workspaceScriptSchema = z.object({
  title: z.string(),
  args: z.record(z.string()).default({}),
  script: z.string(),
});

export interface WorkspaceWorkspaceConfig {
  name: string;
  image: string;
  tag: string;
  sshPrivateKey?: string;
  repositories: Array<RepositoryConfig>;
  initScripts: Array<WorkspaceScriptConfig | WorkspaceIncludeConfig>;
  ports: Array<WorkspacePortConfig>;
  env: Record<string, string>;
  secrets: Record<string, string>;
  volumes: Array<WorkspaceVolumeConfig>;
}

export const workspaceWorkspaceSchema = z.object({
  name: z.string().default('workspace'),
  image: z.string().default(Settings.theia.image),
  tag: z.string().default(Settings.theia.tag),
  sshPrivateKey: z.string().optional(),
  repositories: z.array(workspaceRepositorySchema).default([]),
  initScripts: z.array(z.union([workspaceScriptSchema, workspaceIncludeSchema])).default([]),
  ports: z.array(workspacePortSchema).default([]),
  env: z.record(z.string()).default({}),
  secrets: z.record(z.string()).default({}),
  volumes: z.array(workspaceVolumeSchema).default([]),
});

export interface WorkspacePVCConfig {
  storageClassName: string;
  size: string;
}

export const workspacePVCSchema = z.object({
  storageClassName: z.string().default('manual'),
  size: z.string().default('1Gi'),
});

export interface WorkspaceConfig {
  name: string;
  namespace: string;
  domain: string;
  registryURL: string;
  nodeSelector: Record<string, string>;
  pvc: WorkspacePVCConfig;
  gateway: WorkspaceGatewayConfig;
  workspace: WorkspaceWorkspaceConfig;
  components: Array<WorkspaceComponentConfig | WorkspaceIncludeConfig>;
}

export const workspaceSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  domain: z.string(),
  registryURL: z.string().default('https://raw.githubusercontent.com/feaworkspace/templates/refs/heads/main'),
  nodeSelector: z.record(z.string()).default({}),
  pvc: workspacePVCSchema,
  gateway: workspaceGatewaySchema,
  workspace: workspaceWorkspaceSchema,
  components: z.array(z.union([workspaceComponentSchema, workspaceIncludeSchema])).default([]),
});