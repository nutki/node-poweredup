import { Peripheral } from "@abandonware/noble";

import { LPF2Hub } from "./lpf2hub";
import { Port } from "./port";

import * as Consts from "./consts";

import Debug = require("debug");
import { IBLEDevice } from "./interfaces";
const debug = Debug("pupremote");


/**
 * The PUPRemote is emitted if the discovered device is a Powered UP Remote.
 * @class PUPRemote
 * @extends LPF2Hub
 * @extends Hub
 */
export class PUPRemote extends LPF2Hub {


    public static IsPUPRemote (peripheral: Peripheral) {
        return (
            peripheral.advertisement &&
            peripheral.advertisement.serviceUuids &&
            peripheral.advertisement.serviceUuids.indexOf(Consts.BLEService.LPF2_HUB.replace(/-/g, "")) >= 0 &&
            peripheral.advertisement.manufacturerData &&
            peripheral.advertisement.manufacturerData.length > 3 &&
            peripheral.advertisement.manufacturerData[3] === Consts.BLEManufacturerData.POWERED_UP_REMOTE_ID
        );
    }


    protected _ledPort = 0x34;
<<<<<<< HEAD
    protected _voltagePort = 0x3b;
    protected _voltageMaxV = 6.4;
    protected _voltageMaxRaw = 3200;
=======
>>>>>>> 7255c83ae92bcc377de833c9f2caba3770e7df46


    constructor (device: IBLEDevice, autoSubscribe: boolean = true) {
        super(device, autoSubscribe);
        this.type = Consts.HubType.POWERED_UP_REMOTE;
        this._ports = {
            "LEFT": new Port("LEFT", 0),
            "RIGHT": new Port("RIGHT", 1)
        };
        debug("Discovered Powered UP Remote");
    }


    public connect () {
        return new Promise(async (resolve, reject) => {
            debug("Connecting to Powered UP Remote");
            await super.connect();
            debug("Connect completed");
            return resolve();
        });
    }


}
