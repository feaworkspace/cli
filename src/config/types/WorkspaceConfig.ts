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
  remote: string;
  name?: string;
  branch?: string;
}

export const workspaceRepositorySchema = z.object({
  remote: z.string(),
  name: z.string().optional(),
  branch: z.string().optional(),
});

export interface WorkspaceServerConfig {
  name: string;
  image: string;
  tag: string;
  users: string[];
  domain: string;
  firebaseServiceAccountKey: string;
}

export const workspaceServerSchema = z.object({
  name: z.string().default('ws-portal'),
  image: z.string().default(Settings.server.image),
  tag: z.string().default(Settings.server.tag),
  users: z.array(z.string()),
  domain: z.string(),
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
  gitPrivateKey?: string;
  repositories: Array<RepositoryConfig>;
  init: Array<WorkspaceScriptConfig | WorkspaceIncludeConfig>;
  ports: Array<WorkspacePortConfig>;
  env: Record<string, string>;
  secrets: Record<string, string>;
  volumes: Array<WorkspaceVolumeConfig>;
}

export const workspaceWorkspaceSchema = z.object({
  name: z.string().default('workspace'),
  image: z.string().default(Settings.workspace.image),
  tag: z.string().default(Settings.workspace.tag),
  gitPrivateKey: z.string().optional(),
  repositories: z.array(workspaceRepositorySchema).default([]),
  init: z.array(z.union([workspaceScriptSchema, workspaceIncludeSchema])).default([]),
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
  nodeSelector: Record<string, string>;
  pvc: WorkspacePVCConfig;
  server: WorkspaceServerConfig;
  workspace: WorkspaceWorkspaceConfig;
  components: Array<WorkspaceComponentConfig | WorkspaceIncludeConfig>;
}

export const workspaceSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  nodeSelector: z.record(z.string()).default({}),
  pvc: workspacePVCSchema,
  server: workspaceServerSchema,
  workspace: workspaceWorkspaceSchema,
  components: z.array(z.union([workspaceComponentSchema, workspaceIncludeSchema])).default([]),
});