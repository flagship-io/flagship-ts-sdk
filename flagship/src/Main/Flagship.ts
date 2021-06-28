import {Visitor} from "./Visitor.ts";
import {FlagshipStatus} from "../Enum/FlagshipStatus";
import {FlagshipConfig} from "../config/FlagshipConfig";
import {DecisionApiConfig} from "../config/DecisionApiConfig";
import {ConfigManager} from "../config/ConfigManager";
import {ApiManager} from "../decision/ApiManager";

export class Flagship {
    private static _instance?: Flagship = undefined;
    private _configManger: ConfigManager;
    private _config: FlagshipConfig;
    private _status: FlagshipStatus;


    set config(value: FlagshipConfig) {
        this._config = value;
    }

    get config(): FlagshipConfig {
        return this._config;
    }

    private set configManager(value: ConfigManager) {
        this._configManger = value;
    }

    protected static getInstance(): Flagship {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }

    private static isReady(): boolean {
        const apiKey = this._instance.config.apiKey;
        const envId = this._instance.config.envId;
        return (this._instance && true && apiKey !== null && apiKey !== "" && envId != null && envId != "");
    }

    protected setStatus(status: FlagshipStatus): void {

        if (this.config && this.config.statusChangedCallback && this._status !== status) {
            this.config.statusChangedCallback(status);
        }
        this._status = status;
    }

    public static getStatus(): FlagshipStatus {
        return this.getInstance()._status;
    }


    public static getConfig(): FlagshipConfig {
        return this.getInstance()._config;
    }

    public static start(
        envId: string,
        apiKey: string,
        config?: FlagshipConfig
    ): void {
        const flagship = this.getInstance();


        if (!config) {
            config = new DecisionApiConfig(envId, apiKey);
        }
        config.envId = envId;
        config.apiKey = apiKey;

        flagship.config = config;

        flagship.setStatus(FlagshipStatus.NOT_READY);

        //check custom logger
        if (!config.logManager) {
            // set default logManager
        }

        if (!envId || envId === "" || !apiKey || apiKey === "") {
            //To Do change to config.logManager
            console.log("Params 'envId' and 'apiKey' must not be null or empty.");
            return;
        }

        const decisionManager = new ApiManager({});
        const trackingManager = {};
        flagship.configManager = new ConfigManager(config, decisionManager, trackingManager);

        if (this.isReady()) {
            flagship.setStatus(FlagshipStatus.READY);
            //To Do change to config.logManager
            console.log("Flagship SDK (version: V1) READY")
        } else {
            flagship.setStatus(FlagshipStatus.NOT_READY);
        }
    }

    public static newVisitor(
        visitorId: string,
        context: Map<string, string | number | boolean>
    ): Visitor|null {
        if (!this.isReady() || visitorId==""){
            return null
        }
        const fsContext = this.getInstance()._context;
        if (fsContext !== undefined) {
            return new Visitor(visitorId, context, fsContext);
        }
        throw new Error("Config is empty");
    }
}
