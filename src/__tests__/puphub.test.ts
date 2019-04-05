import * as Consts from "../consts";
import { PUPHub } from "../puphub";
import { TestDevice } from "../testdevice";

const device = new TestDevice()
const hub = new PUPHub(device);


beforeAll((done) => {
    device.on("discoverComplete", async () => {
        await hub.connect();
        device.clearOutbox();
        done();
    });
});


afterAll(async (done) => {
    await hub.disconnect();
    done();
});


test("Set motor speed", async (done) => {
    hub.setMotorSpeed("A", 52);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x81, 0x00, 0x11, 0x60, 0x00, 0x34, 0x00, 0x00]));
    done();
});


test("Set motor speed for specific amount of time", async (done) => {
    hub.setMotorSpeed("A", 52, 3000);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x81, 0x00, 0x11, 0x60, 0x00, 0x34, 0x00, 0x00]));
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x81, 0x00, 0x11, 0x60, 0x00, 0x00, 0x00, 0x00]));
    done();
});


test("Brake a motor", async (done) => {
    hub.brakeMotor("A");
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x81, 0x00, 0x11, 0x60, 0x00, 0x7f, 0x00, 0x00]));
    done();
});


test("Attempt to set two speeds on a port that only accepts one", async (done) => {
    expect(() => hub.setMotorSpeed("A", [52, 32])).toThrow("Port A can only accept a single speed");
    done();
});


test("Set light brightness", async (done) => {
    hub.setLightBrightness("B", 74);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00, 0x4a]));
    done();
});


test("Set light brightness for specific amount of time", async (done) => {
    hub.setLightBrightness("B", 74, 2000);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00, 0x4a]));
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00, 0x00]));
    done();
});