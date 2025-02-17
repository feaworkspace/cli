import K8sResource from "./K8sResource.js";

export default class K8sNamespace extends K8sResource {
    public constructor({ name }: {name: string}) {
        super({
            apiVersion: "v1",
            kind: "Namespace",
            metadata: { name }
        });
    }
}