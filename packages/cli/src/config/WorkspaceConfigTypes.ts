import * as z from 'zod';

export interface Repository {
  url: string;
  name?: string;
  branch?: string;
}

export interface Component {
  name: string;
  image: string;
  ports: Record<string, Port>;
  env?: Record<string, any>;
  volumes?: Record<string, Volume>;
}

export interface Port {
  number: number;
  protocol?: string;
  ingress?: Ingress | null;
}

export interface NamedPort extends Port {
  name: string;
}

export interface Ingress {
  subdomain?: string;
  path?: string;
  // rule?: string;
}

export interface Include {
  include: string;
  override?: Record<any, any>;
}

export interface Volume {
  size: string;
  mountPath: string;
}

export interface YamlConfig {
  version: number;
  namespace: string;
  workspace: string;
  subdomainFormat: string;
  nodeSelector?: Record<string, string>;
  repositories: Repository[];
  components: (Component | Include)[];
}

export interface YamlTemplate {
  version: number;
  components: Component[];
}

export type MergedYamlConfig = Omit<YamlConfig, "components"> & { components: Component[] };

export const yamlComponentSchema = z.object({
  name: z.string(),
  image: z.string(),
  ports: z.record(z.object({
    number: z.number(),
    protocol: z.string().default('TCP'),
    ingress: z.object({
      path: z.string().optional(),
      subdomain: z.string().optional()
    }).optional().nullable()
  })),
  env: z.record(z.any()).optional(),
  volumes: z.record(z.object({
    size: z.string(),
    mountPath: z.string()
  })).optional()
});

export const yamlComponentsSchema = z.array(yamlComponentSchema);

export const yamlTemplateSchema = z.object({
  version: z.number().int(),
  components: yamlComponentsSchema
});

export const yamlConfigSchema = z.object({
  version: z.number().int(),
  namespace: z.string(),
  workspace: z.string(),
  nodeSelector: z.record(z.string()).optional(),
  subdomainFormat: z.string().default('%s.'),
  repositories: z.array(z.object({
    url: z.string(),
    name: z.string().optional(),
    branch: z.string().optional()
  })),
  components: z.array(z.union([
    yamlComponentSchema,
    z.object({
      include: z.string(),
      override: z.record(z.any()).optional()
    })
  ]))
});