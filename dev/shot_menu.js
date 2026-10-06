'use strict';
const { launch, INDEX_URL, devfile, run } = require('./lib');

run(async () => {
  const b = await launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(INDEX_URL); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: devfile('shot_menu.png') });
  await b.close();
});
