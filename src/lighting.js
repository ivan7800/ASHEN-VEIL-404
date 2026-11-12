/* Original surface materials and light baked into the dungeon grid. */
const VeilLighting = (() => {
  const materials = {
    crypt: { stone: [105, 91, 110], floor: [75, 68, 89], fog: [12, 11, 23] },
    catacomb: { stone: [70, 103, 105], floor: [57, 95, 101], fog: [5, 21, 29] },
    chapel: { stone: [100, 77, 126], floor: [84, 63, 116], fog: [19, 10, 29] },
    sanctuary: { stone: [127, 83, 89], floor: [108, 63, 79], fog: [27, 11, 21] },
  };

  function bake(grid, fixtures) {
    return grid.map((row, y) => row.map((_, x) => {
      let light = 0;
      for (const fixture of fixtures) {
        const distance = Math.hypot(fixture.x - x - 0.5, fixture.y - y - 0.5);
        light += Math.max(0, 1 - distance / fixture.radius) ** 2 * fixture.power;
      }
      return Math.min(1, light);
    }));
  }

  function surface(material, u, v, ceiling) {
    const rib = (u & 31) < 2 || (v & 31) < 2;
    const edge = (u & 31) === 2 || (v & 31) === 2;
    const grain = ((u * 17 ^ v * 29 ^ (u * v)) & 15) / 85;
    const diamond = Math.abs((u & 31) - 16) + Math.abs((v & 31) - 16);
    const tint = ceiling ? 0.53 : 1;
    const pattern = rib ? 0.38 : edge ? 1.18 : diamond === 9 ? 1.17 : 0.86;
    return material.floor.map(channel => channel * (pattern + grain) * tint);
  }

  const surfaceColors = Object.fromEntries(Object.entries(materials).map(([name, material]) => {
    const layers = [false, true].map(ceiling => {
      const colors = new Uint8Array(32 * 32 * 3);
      for (let v = 0; v < 32; v++) for (let u = 0; u < 32; u++) {
        colors.set(surface(material, u, v, ceiling), (v * 32 + u) * 3);
      }
      return colors;
    });
    return [name, layers];
  }));

  function engrave(canvas, region) {
    const paint = canvas.getContext('2d');
    const material = materials[region];
    const rgb = (channels, alpha) => 'rgba(' + channels.join(',') + ',' + alpha + ')';
    paint.fillStyle = rgb(material.stone, 0.28);
    paint.fillRect(0, 0, 64, 64);
    paint.fillStyle = rgb(material.fog, 0.45);
    paint.fillRect(0, 51, 64, 13);
    paint.fillRect(0, 6, 64, 2);
    paint.fillRect(0, 53, 64, 2);
    // Recessed gothic relief with an edge highlight and carved stone ribs.
    if (region === 'crypt' || region === 'chapel' || region === 'sanctuary') {
      paint.beginPath();
      paint.moveTo(15, 51); paint.lineTo(15, 28);
      paint.quadraticCurveTo(16, 18, 32, 12);
      paint.quadraticCurveTo(48, 18, 49, 28);
      paint.lineTo(49, 51);
      paint.fillStyle = rgb(material.fog, 0.58);
      paint.fill();
      paint.lineWidth = 2;
      paint.strokeStyle = rgb(material.stone.map(value => value + 44), 0.52);
      paint.stroke();
      paint.fillStyle = rgb(material.stone.map(value => value + 26), 0.55);
      paint.fillRect(10, 21, 2, 28);
      paint.fillRect(52, 21, 2, 28);
    }
    paint.fillStyle = rgb(material.stone.map(value => value + 38), 0.64);
    paint.fillRect(0, 8, 64, 1);
    paint.fillRect(0, 55, 64, 1);
    for (let x = 3; x < 64; x += 6) {
      paint.fillRect(x, 57, 2, 2);
      if (region === 'sanctuary' || region === 'chapel') paint.fillRect(x, 4, 1, 2);
    }
  }

  return { materials, surfaceColors, bake, engrave };
})();
