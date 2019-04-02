import { Peripheral } from "noble";

import { LPF2Hub } from "./lpf2hub";
import { Port } from "./port";

import * as Consts from "./consts";

import Debug = require("debug");
import { IBLEDevice } from "./interfaces";
const debug = Debug("spikeprimehub");


/**
 * The SPIKEPrimeHub is emitted if the discovered device is a SPIKE Prime Hub.
 * @class SPIKEPrimeHub
 * @extends LPF2Hub
 * @extends Hub
 */
export class SPIKEPrimeHub extends LPF2Hub {


    // We set JSDoc to ignore these events as a SPIKE Prime Hub will never emit them.

    /**
     * @event SPIKEPrimeHub#speed
     * @ignore
     */


    public static IsSPIKEPrimeHub (peripheral: Peripheral) {
        return (peripheral.advertisement &&
            peripheral.advertisement.serviceUuids &&
            peripheral.advertisement.serviceUuids.indexOf(Consts.BLEService.LPF2_HUB.replace(/-/g, "")) >= 0 && peripheral.advertisement.manufacturerData[3] === Consts.BLEManufacturerData.BOOST_MOVE_HUB_ID);
    }


    constructor (device: IBLEDevice, autoSubscribe: boolean = true) {
        super(device, autoSubscribe);
        this.type = Consts.HubType.SPIKE_PRIME_HUB;
        this._ports = {
            "A": new Port("A", 55),
            "B": new Port("B", 56),
            "AB": new Port("AB", 57),
            "TILT": new Port("TILT", 58),
            "C": new Port("C", 1),
            "D": new Port("D", 2)
        };
        debug("Discovered SPIKE Prime Hub");
    }


    public connect () {
        return new Promise(async (resolve, reject) => {
            debug("Connecting to SPIKE Prime Hub");
            await super.connect();
            debug("Connect completed");
            return resolve();
        });
    }


    /**
     * Set the motor speed on a given port.
     * @method SPIKEPrimeHub#setMotorSpeed
     * @param {string} port
     * @param {number | Array.<number>} speed For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100. Stop is 0. If you are specifying port AB to control both motors, you can optionally supply a tuple of speeds.
     * @param {number} [time] How long to activate the motor for (in milliseconds). Leave empty to turn the motor on indefinitely.
     * @returns {Promise} Resolved upon successful completion of command. If time is specified, this is once the motor is finished.
     */
    public setMotorSpeed (port: string, speed: number | [number, number], time?: number | boolean) {
        const portObj = this._portLookup(port);
        if (portObj.id !== "AB" && speed instanceof Array) {
            throw new Error(`Port ${portObj.id} can only accept a single speed`);
        }
        let cancelEventTimer = true;
        if (typeof time === "boolean") {
            if (time === true) {
                cancelEventTimer = false;
            }
            time = undefined;
        }
        if (cancelEventTimer) {
            portObj.cancelEventTimer();
        }
        return new Promise((resolve, reject) => {
            if (time && typeof time === "number") {

                if (portObj.type === Consts.DeviceType.BOOST_TACHO_MOTOR || portObj.type === Consts.DeviceType.BOOST_MOVE_HUB_MOTOR) {
                    portObj.busy = true;
                    let data = null;
                    if (portObj.id === "AB") {
                        data = Buffer.from([0x81, portObj.value, 0x11, 0x0a, 0x00, 0x00, this._mapSpeed(speed instanceof Array ? speed[0] : speed), this._mapSpeed(speed instanceof Array ? speed[1] : speed), 0x64, 0x7f, 0x03]);
                    } else {
                        // @ts-ignore: The type of speed is properly checked at the start
                        data = Buffer.from([0x81, portObj.value, 0x11, 0x09, 0x00, 0x00, this._mapSpeed(speed), 0x64, 0x7f, 0x03]);
                    }
                    data.writeUInt16LE(time > 65535 ? 65535 : time, 4);
                    this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                    portObj.finished = () => {
                        return resolve();
                    };
                } else {
                    // @ts-ignore: The type of speed is properly checked at the start
                    const data = Buffer.from([0x81, portObj.value, 0x11, 0x51, 0x00, this._mapSpeed(speed)]);
                    this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                    const timeout = global.setTimeout(() => {
                        const data = Buffer.from([0x81, portObj.value, 0x11, 0x51, 0x00, 0x00]);
                        this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                        return resolve();
                    // @ts-ignore: The type of time is properly checked at the start
                    }, time);
                    portObj.setEventTimer(timeout);
                }

            } else {

                if (portObj.type === Consts.DeviceType.BOOST_TACHO_MOTOR || portObj.type === Consts.DeviceType.BOOST_MOVE_HUB_MOTOR) {
                    portObj.busy = true;
                    let data = null;
                    if (portObj.id === "AB") {
                        data = Buffer.from([0x81, portObj.value, 0x11, 0x02, this._mapSpeed(speed instanceof Array ? speed[0] : speed), this._mapSpeed(speed instanceof Array ? speed[1] : speed), 0x64, 0x7f, 0x03]);
                    } else {
                        // @ts-ignore: The type of speed is properly checked at the start
                        data = Buffer.from([0x81, portObj.value, 0x11, 0x01, this._mapSpeed(speed), 0x64, 0x7f, 0x03]);
                    }
                    this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                    portObj.finished = () => {
                        return resolve();
                    };
                } else {
                    // @ts-ignore: The type of speed is properly checked at the start
                    const data = Buffer.from([0x81, portObj.value, 0x11, 0x51, 0x00, this._mapSpeed(speed)]);
                    this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                }

            }
        });
    }


    /**
     * Ramp the motor speed on a given port.
     * @method SPIKEPrimeHub#rampMotorSpeed
     * @param {string} port
     * @param {number} fromSpeed For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100. Stop is 0.
     * @param {number} toSpeed For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100. Stop is 0.
     * @param {number} time How long the ramp should last (in milliseconds).
     * @returns {Promise} Resolved upon successful completion of command.
     */
    public rampMotorSpeed (port: string, fromSpeed: number, toSpeed: number, time: number) {
        const portObj = this._portLookup(port);
        portObj.cancelEventTimer();
        return new Promise((resolve, reject) => {
            this._calculateRamp(fromSpeed, toSpeed, time, portObj)
            .on("changeSpeed", (speed) => {
                this.setMotorSpeed(port, speed, true);
            })
            .on("finished", resolve);
        });
    }


    /**
     * Rotate a motor by a given angle.
     * @method SPIKEPrimeHub#setMotorAngle
     * @param {string} port
     * @param {number} angle How much the motor should be rotated (in degrees).
     * @param {number | Array.<number>} [speed=100] For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100. Stop is 0. If you are specifying port AB to control both motors, you can optionally supply a tuple of speeds.
     * @returns {Promise} Resolved upon successful completion of command (ie. once the motor is finished).
     */
    public setMotorAngle (port: string, angle: number, speed: number | [number, number] = 100) {
        const portObj = this._portLookup(port);
        if (!(portObj.type === Consts.DeviceType.BOOST_TACHO_MOTOR || portObj.type === Consts.DeviceType.BOOST_MOVE_HUB_MOTOR)) {
            throw new Error("Angle rotation is only available when using a Boost Tacho Motor or Boost Move Hub Motor");
        }
        if (portObj.id !== "AB" && speed instanceof Array) {
            throw new Error(`Port ${portObj.id} can only accept a single speed`);
        }
        portObj.cancelEventTimer();
        return new Promise((resolve, reject) => {
            portObj.busy = true;
            let data = null;
            if (portObj.id === "AB") {
                data = Buffer.from([0x81, portObj.value, 0x11, 0x0c, 0x00, 0x00, 0x00, 0x00, this._mapSpeed(speed instanceof Array ? speed[0] : speed), this._mapSpeed(speed instanceof Array ? speed[1] : speed), 0x64, 0x7f, 0x03]);
            } else {
                // @ts-ignore: The type of speed is properly checked at the start
                data = Buffer.from([0x81, portObj.value, 0x11, 0x0b, 0x00, 0x00, 0x00, 0x00, this._mapSpeed(speed), 0x64, 0x7f, 0x03]);
            }
            data.writeUInt32LE(angle, 4);
            this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
            portObj.finished = () => {
                return resolve();
            };
        });
    }


    /**
     * Fully (hard) stop the motor on a given port.
     * @method SPIKEPrimeHub#brakeMotor
     * @param {string} port
     * @returns {Promise} Resolved upon successful completion of command.
     */
    public brakeMotor (port: string) {
        return this.setMotorSpeed(port, 127);
    }


    /**
     * Set the light brightness on a given port.
     * @method SPIKEPrimeHub#setLightBrightness
     * @param {string} port
     * @param {number} brightness Brightness value between 0-100 (0 is off)
     * @param {number} [time] How long to turn the light on (in milliseconds). Leave empty to turn the light on indefinitely.
     * @returns {Promise} Resolved upon successful completion of command. If time is specified, this is once the light is turned off.
     */
    public setLightBrightness (port: string, brightness: number, time?: number) {
        const portObj = this._portLookup(port);
        portObj.cancelEventTimer();
        return new Promise((resolve, reject) => {
            const data = Buffer.from([0x81, portObj.value, 0x11, 0x51, 0x00, brightness]);
            this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
            if (time) {
                const timeout = global.setTimeout(() => {
                    const data = Buffer.from([0x81, portObj.value, 0x11, 0x51, 0x00, 0x00]);
                    this._writeMessage(Consts.BLECharacteristic.LPF2_ALL, data);
                    return resolve();
                }, time);
                portObj.setEventTimer(timeout);
            } else {
                return resolve();
            }
        });
    }


}
