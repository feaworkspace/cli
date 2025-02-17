import K8sResource from "./K8sResource.js";

export default class K8sPersistentVolumeClaim extends K8sResource {
    public readonly mountPath: string;

    public constructor(
        { name, namespace, storageClassName, accessModes, size, mountPath }:
        {name: string, namespace: string, storageClassName: string, accessModes: string[], size: string, mountPath: string}
    ) {
        super({
            apiVersion: "v1",
            kind: "PersistentVolumeClaim",
            metadata: { name, namespace },
            spec: {
                storageClassName,
                accessModes,
                resources: {
                    requests: {
                        storage: size
                    }
                }
            }
        });
        this.mountPath = mountPath;
    }
}