const { FreeboxRegister } = require(".");

describe("FreeboxRegister default instance", () => {
  const freeboxRegister = new FreeboxRegister();

  test("app_id generated", () => {
    expect(freeboxRegister.appIdentity.app_id).toMatch(/fbx.nodejs_app_/);
  });

  test("app_name generated", () => {
    expect(freeboxRegister.appIdentity.app_name).toMatch(/nodejs_app_/);
  });

  test("app_version default", () => {
    expect(freeboxRegister.appIdentity.app_version).toMatch("1.0.0");
  });

  test("device_name default", () => {
    expect(freeboxRegister.appIdentity.device_name).toMatch("NodeJS");
  });
});

describe("FreeboxRegister user custom config", () => {
  const freeboxRegister = new FreeboxRegister({
    app_id: "fbx.my_amazing_app",
    app_name: "My Amazing App",
    app_version: "1.0.0",
    device_name: "My cool PC",
  });

  test("this.appIdentity is equal to constructor config", () => {
    expect(freeboxRegister.appIdentity).toEqual({
      app_id: "fbx.my_amazing_app",
      app_name: "My Amazing App",
      app_version: "1.0.0",
      device_name: "My cool PC",
    });
  });
});
