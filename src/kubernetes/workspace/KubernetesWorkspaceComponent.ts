import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceConfig, WorkspaceWorkspaceConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";

export default class KubernetesWorkspaceComponent extends KubernetesComponent {
    public static readonly NAME = "theia";

    public constructor(mainConfig: WorkspaceConfig, config: WorkspaceWorkspaceConfig) {
        super(mainConfig, config as any);
        
        this.config = merge(config, {
            namespace: mainConfig.namespace,
            command: ["bash", "-c"],
            args:
            [`
# Setup ssh private key for git
if [ -n "$SSH_PRIVATE_KEY" ] ; then
    echo "Set SSH key"
    mkdir -p ~/.ssh
    echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    chmod 700 ~/.ssh/id_rsa
fi

git config --global user.name "Workspace"
git config --global user.email "workspace"

# Clone repositories if needed
if [ -n "$GIT_REPOSITORIES" ] ; then
    GIT_REPOSITORIES=$(echo "$GIT_REPOSITORIES" | jq -c '.[]')

    for repo in $GIT_REPOSITORIES; do
        repo_url=$(echo $repo | jq -r -c '.url')
        repo_name=$(basename -s .git "$repo_url")
        repo_host=$(echo "$repo_url" | cut -d@ -f2 | cut -d: -f1)
        repo_path=/workspace/$(echo $repo | jq -r -c ".path // \\"$repo_name\\"")
        
        if [ ! -d "$repo_path" ] ; then
            ssh-keyscan -t rsa $repo_host >> ~/.ssh/known_hosts
            echo "Cloning repository $repo_url"
            git clone $repo_url $repo_path
        fi
    done
    # for repo in "$GIT_REPOSITORIES" ; do
    #     if [ -n "$dir" && ! -f "$dir" ] ; then
    #         mkdir -p "$dir"
    #     fi
    #     git clone $repo
    # done
fi

node /home/theia/applications/browser/lib/backend/main.js /workspace --hostname=0.0.0.0 --port=28544
            `],
            env: {
                "COLLABORATION_SERVER_URL": "https://" + this.getHost("oct-server"),
                "WORKSPACE_SERVER_URL": "https://" + this.getHost(this.mainConfig.gateway.name),
                "GIT_REPOSITORIES": JSON.stringify(config.repositories || [])
            },
            secrets: {
                "SSH_PRIVATE_KEY": config.sshPrivateKey ?? ""
            },
            volumes: [
                {
                    name: "workspace",
                    mountPath: "/workspace"
                }
            ],
            ports: [
                {
                    name: KubernetesWorkspaceComponent.NAME,
                    protocol: "TCP",
                    number: 28544,
                    ingress: {
                        subdomain: KubernetesWorkspaceComponent.NAME,
                        path: "/",
                        auth: true
                    }
                }
            ]
        });
    }
}
