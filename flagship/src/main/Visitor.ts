import {Modification} from "../Model/Modification.ts";
import {ConfigManager} from "../config/ConfigManager.ts";

export class Visitor {
    private _visitorId: string;
    private _context!: Map<string,string|number|boolean>;
    private _modifications: Map<string, Modification>;
    private _configManager: ConfigManager;

    constructor(
        visitorId: string,
        context: Map<string, string | number | boolean>,
        configManager: ConfigManager
    ) {
        this._visitorId = visitorId;
        this._modifications = new Map<string, Modification>();
        this._configManager = configManager;
        this.updateContext(context);
    }


    get configManager(): ConfigManager {
        return this._configManager;
    }

    public updateContext(context: Map<string, string | number | boolean>): void {
        if (context != null) {
            for (const [k, v] of Object.entries(context)) {
                this.updateContextKeyValue(k, v);
            }
        }
    }

    public updateContextKeyValue(key: string, value: string | number | boolean): void {
        const valueType = typeof (value);
        if (typeof (key) != "string" || key == "" || (valueType != "string" && valueType != "number" && valueType != "boolean")) {
            //To Do change to config.logManager
            console.log(`params 'key' must be a non null String, and 'value' must be one of the following types : String, Number, Boolean`);
            return
        }
        this._context.set(key, value);

    }

    public async synchronizeModifications(): Promise<Visitor> {
        try {
            const modifications: Map<string, Modification> | undefined =
                await this.configManager.decisionManager?.getCampaignsModifications(
                    this._visitorId,
                    this._context
                );
            this._modifications = modifications;
        } catch (error) {
            console.log(error);
        }
        return this;
    }
}
