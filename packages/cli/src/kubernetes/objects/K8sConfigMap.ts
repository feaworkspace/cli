import K8sResource from "./K8sResource.js";

export default class K8sConfigMap extends K8sResource {
    public constructor({ name, namespace, data}: {name: string, namespace: string, data: { [key: string]: any }}) {
        super({
            apiVersion: "v1",
            kind: "ConfigMap",
            metadata: { name, namespace },
            data: K8sConfigMap.dataValuesToString(data)
        });
    }

    private static dataValuesToString(data: { [key: string]: any }): { [key: string]: string } {
        return Object.entries(data).reduce((acc, [key, value]) => {
            // @ts-ignore
            acc[key] = value + "";
            return acc;
        }, {});
    }
}