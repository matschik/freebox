const { FreeboxRegister } = require("../index");

async function main() {
  const freeboxRegister = new FreeboxRegister({
    app_id: "fbx.my_amazing_app",
    app_name: "My Amazing App",
    app_version: "1.0.0",
    device_name: "My cool PC",
  });

  // Obtaining an app_token & everything you need
  // following the guide at https://dev.freebox.fr/sdk/os/login/
  const access = await freeboxRegister.register();
}

main().catch((err) => console.error(err));
