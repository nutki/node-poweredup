import Debug = require("debug");
import { EventEmitter } from "events";
import { IBLEDevice } from "./interfaces";
const debug = Debug("testdevice");


export class TestDevice extends EventEmitter implements IBLEDevice {

    private _uuid: string;
    private _name: string = "";

    private _listeners: {[uuid: string]: any} = {};
    private _characteristics: {[uuid: string]: any} = {};

    private _queue: Promise<any> = Promise.resolve();
    private _mailbox: Buffer[] = [];
    private _outbox: Buffer[] = [];
    private _outboxCallback: (() => void) | null = null;

    private _connected: boolean = false;
    private _connecting: boolean = false;


    constructor () {
        super();
        this._uuid = "test-device";
        this._name = "Test Device";
        setTimeout(() => {
            this.emit("discoverComplete");
        }, 2000);
    }


    public get uuid () {
        return this._uuid;
    }


    public get name () {
        return this._name;
    }


    public get connecting () {
        return this._connecting;
    }


    public get connected () {
        return this._connected;
    }


    public connect () {
        return new Promise((resolve, reject) => {
            this._connected = true;
            return resolve();
        });
    }


    public disconnect () {
        return new Promise((resolve, reject) => {
            return resolve();
        });
    }


    public discoverCharacteristicsForService (uuid: string) {
        return new Promise((resolve, reject) => {
            return resolve();
        });
    }


    public subscribeToCharacteristic (uuid: string, callback: (data: Buffer) => void) {
        return;
    }


    public addToCharacteristicMailbox (uuid: string, data: Buffer) {
        this._mailbox.push(data);
    }


    public readFromCharacteristic (uuid: string, callback: (err: string | null, data: Buffer | null) => void) {
        callback(null, Buffer.alloc(0));
    }


    public writeToCharacteristic (uuid: string, data: Buffer, callback?: () => void) {
        this._outbox.push(data);
        if (this._outboxCallback) {
            this._outboxCallback();
            this._outboxCallback = null;
        }
        if (callback) {
            callback();
        }
    }


    public readFromOutbox () {
        return new Promise((resolve, reject) => {
            if (this._outbox.length >= 1) {
                return resolve(this._outbox.shift());
            } else {
                this._outboxCallback = () => {
                    return resolve(this._outbox.shift());
                };
            }
        });
    }


    public clearOutbox () {
        this._outbox = [];
        this._outboxCallback = null;
    }


    private _sanitizeUUID (uuid: string) {
        return uuid.replace(/-/g, "");
    }


}
