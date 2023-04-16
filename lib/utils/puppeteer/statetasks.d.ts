export declare class PuppeteerStateTasks {
    currentAddTask: any;
    currentDeactivateTask: any;
    private addTasks;
    private deactivateTasks;
    private nextAddTaskIndex;
    private nextDeactivateTaskIndex;
    private browser;
    private context;
    private auth;
    private countrycode;
    private countries;
    private language;
    private category;
    private ISOData;
    constructor(auth: any);
    private static setHTMLInputElementValue;
    private static setHTMLInputElementChecked;
    validateParameterCountryCode(countrycode: string): Promise<{
        selected: any;
        values: any;
    }>;
    validateParameterCategory(category: string): {
        selected: any;
        values: any;
    };
    validateParameterLanguage(language: string): {
        selected: any;
        values: any;
    };
    validateParameter(countrycode: string, category: string, language: string): Promise<{
        countrycode: string;
        category: string;
        language: string;
    }>;
    validateData(): {
        add: any;
        deactivate: any;
    };
    getData(countrycode: string, category: string, language: string): Promise<{
        add: any[];
        deactivate: any[];
    }>;
    setCountryIntegrationValue(): Promise<boolean>;
    executeAdd(): Promise<string>;
    executeDeactivate(): Promise<boolean>;
    getNextAdd(): this;
    getNextDeactivate(): this;
    close(): Promise<void>;
    open(): Promise<void>;
}
