const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const frontendLogo = path.resolve(
  root,
  '..',
  'campus-resource-hub-frontend',
  'public',
  'favicon.svg',
);

const blue = '#2563EB';

const iosIconSet = path.join(
  root,
  'ios',
  'CampusResourceHub',
  'Images.xcassets',
  'AppIcon.appiconset',
);
const iosSplashSet = path.join(
  root,
  'ios',
  'CampusResourceHub',
  'Images.xcassets',
  'SplashLogo.imageset',
);
const rnAssets = path.join(root, 'src', 'assets');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

const iosIcons = [
  ['Icon-App-20x20@2x.png', 40, '20x20', '2x', 'iphone'],
  ['Icon-App-20x20@3x.png', 60, '20x20', '3x', 'iphone'],
  ['Icon-App-29x29@2x.png', 58, '29x29', '2x', 'iphone'],
  ['Icon-App-29x29@3x.png', 87, '29x29', '3x', 'iphone'],
  ['Icon-App-40x40@2x.png', 80, '40x40', '2x', 'iphone'],
  ['Icon-App-40x40@3x.png', 120, '40x40', '3x', 'iphone'],
  ['Icon-App-60x60@2x.png', 120, '60x60', '2x', 'iphone'],
  ['Icon-App-60x60@3x.png', 180, '60x60', '3x', 'iphone'],
  ['Icon-App-20x20@1x~ipad.png', 20, '20x20', '1x', 'ipad'],
  ['Icon-App-20x20@2x~ipad.png', 40, '20x20', '2x', 'ipad'],
  ['Icon-App-29x29@1x~ipad.png', 29, '29x29', '1x', 'ipad'],
  ['Icon-App-29x29@2x~ipad.png', 58, '29x29', '2x', 'ipad'],
  ['Icon-App-40x40@1x~ipad.png', 40, '40x40', '1x', 'ipad'],
  ['Icon-App-40x40@2x~ipad.png', 80, '40x40', '2x', 'ipad'],
  ['Icon-App-76x76@1x~ipad.png', 76, '76x76', '1x', 'ipad'],
  ['Icon-App-76x76@2x~ipad.png', 152, '76x76', '2x', 'ipad'],
  ['Icon-App-83.5x83.5@2x~ipad.png', 167, '83.5x83.5', '2x', 'ipad'],
  ['Icon-App-1024x1024@1x.png', 1024, '1024x1024', '1x', 'ios-marketing'],
];

const androidIcons = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

async function ensureDir(dir) {
  await fs.mkdir(dir, {recursive: true});
}

async function renderSquarePng(size, output) {
  await sharp(frontendLogo, {density: 1024})
    .resize(size, size)
    .png()
    .toFile(output);
}

async function renderSplashPng(size, output) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: blue,
    },
  })
    .composite([
      {
        input: await sharp(frontendLogo, {density: 1024})
          .resize(Math.round(size * 0.62), Math.round(size * 0.62))
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(output);
}

async function generateIosIcons() {
  await ensureDir(iosIconSet);

  for (const [filename, pixels] of iosIcons) {
    await renderSquarePng(pixels, path.join(iosIconSet, filename));
  }

  await fs.writeFile(
    path.join(iosIconSet, 'Contents.json'),
    JSON.stringify(
      {
        images: iosIcons.map(([filename, , size, scale, idiom]) => ({
          filename,
          idiom,
          scale,
          size,
        })),
        info: {
          author: 'xcode',
          version: 1,
        },
      },
      null,
      2,
    ) + '\n',
  );
}

async function generateIosSplash() {
  await ensureDir(iosSplashSet);

  await renderSplashPng(180, path.join(iosSplashSet, 'SplashLogo.png'));
  await renderSplashPng(360, path.join(iosSplashSet, 'SplashLogo@2x.png'));
  await renderSplashPng(540, path.join(iosSplashSet, 'SplashLogo@3x.png'));

  await fs.writeFile(
    path.join(iosSplashSet, 'Contents.json'),
    JSON.stringify(
      {
        images: [
          {
            filename: 'SplashLogo.png',
            idiom: 'universal',
            scale: '1x',
          },
          {
            filename: 'SplashLogo@2x.png',
            idiom: 'universal',
            scale: '2x',
          },
          {
            filename: 'SplashLogo@3x.png',
            idiom: 'universal',
            scale: '3x',
          },
        ],
        info: {
          author: 'xcode',
          version: 1,
        },
      },
      null,
      2,
    ) + '\n',
  );
}

async function generateAndroidIcons() {
  for (const [folder, pixels] of androidIcons) {
    const dir = path.join(androidRes, folder);
    await ensureDir(dir);
    await renderSquarePng(pixels, path.join(dir, 'ic_launcher.png'));
    await renderSquarePng(pixels, path.join(dir, 'ic_launcher_round.png'));
  }
}

async function generateAppImages() {
  await ensureDir(rnAssets);
  await renderSquarePng(256, path.join(rnAssets, 'app-logo.png'));

  const drawable = path.join(androidRes, 'drawable');
  await ensureDir(drawable);
  await renderSplashPng(288, path.join(drawable, 'splash_logo.png'));
}

async function main() {
  await generateIosIcons();
  await generateIosSplash();
  await generateAndroidIcons();
  await generateAppImages();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
