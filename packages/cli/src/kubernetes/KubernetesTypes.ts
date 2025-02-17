export interface KubernetesObject {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
    };
}

export interface Namespace extends Omit<KubernetesObject, "metadata"> {
    kind: "Namespace";
    metadata: {
        name: string;
    };
}

export interface Service extends Omit<KubernetesObject, "metadata"> {
    kind: "Service";
    metadata: {
        name: string;
        namespace: string;
    };
    spec: {
        selector: Record<string, string>;
        ports: {
            port: number;
            targetPort: number;
        }[];
    };
}

export interface Deployment extends Omit<KubernetesObject, "metadata"> {
    kind: "Deployment";
    metadata: {
        name: string;
        namespace: string;
    };
    spec: {
        replicas: number;
        selector: {
            matchLabels: Record<string, string>;
        };
        template: {
            metadata: {
                labels: Record<string, string>;
            };
            spec: {
                containers: {
                    name: string;
                    image: string;
                    ports: {
                        containerPort: number;
                    }[];
                }[];
            },
            volumes?: {
                name: string;
                secret: {
                    secretName: string;
                };
            }[];
        };
    };
}