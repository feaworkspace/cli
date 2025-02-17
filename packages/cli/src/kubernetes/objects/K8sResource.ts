export default abstract class K8sResource {
    public readonly name: string;

    public constructor(public readonly config: { apiVersion: string, kind: string, metadata: any} & { [key: string]: any }) {
        this.name = config.metadata.name;
    }
}