import * as Consts from "../consts";
import { PUPRemote } from "../pupremote";
import { TestDevice } from "../testdevice";

const device = new TestDevice()
const remote = new PUPRemote(device);


beforeAll((done) => {
    device.on("discoverComplete", async () => {
        await remote.connect();
        device.clearOutbox();
        done();
    });
});


afterAll(async (done) => {
    await remote.disconnect();
    done();
});


test("Set LED color via discrete value", async (done) => {
    remote.setLEDColor(Consts.Color.BLUE);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x41, 0x34, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x08, 0x00, 0x81, 0x34, 0x11, 0x51, 0x00, 0x03]));
    done();
});


test("Turn off LED", async (done) => {
    remote.setLEDColor(false);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x41, 0x34, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x08, 0x00, 0x81, 0x34, 0x11, 0x51, 0x00, 0x00]));
    done();
});


test("Set LED color via RGB values", async (done) => {
    remote.setLEDRGB(127, 32, 233);
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x41, 0x34, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00]));
    expect(await device.readFromOutbox()).toEqual(Buffer.from([0x0a, 0x00, 0x81, 0x34, 0x11, 0x51, 0x01, 0x7f, 0x20, 0xe9]));
    done();
});