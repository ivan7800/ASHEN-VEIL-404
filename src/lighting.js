/* Room palettes, tile patterns and baked fixture weights. */
const VeilLighting = (() => {
  const materials = {
    salt: {floor:[133,118,106],fog:[38,33,38]},
    archive: {floor:[101,74,61],fog:[24,13,17]},
    garden: {floor:[53,84,68],fog:[9,22,19]},
    soundings: {floor:[65,88,96],fog:[8,20,30]},
    sky: {floor:[72,78,118],fog:[13,15,33]},
    crypt: { floor:[95,81,94], fog:[15,10,20] },
    catacomb: { floor:[49,84,83], fog:[5,20,26] },
    chapel: { floor:[94,61,108], fog:[18,8,28] },
    sanctuary: { floor:[118,76,81], fog:[26,10,18] },
    nave: { floor:[55,108,105], fog:[4,23,28] },
  };

  // Coordinates are painted onto the existing grid; these tables never write collision tiles.
  const architecture = {
    crypt: {
      faces: [
        [4,13,'s','niches'],[5,13,'s','tomb'],[7,13,'s','niches'],[8,13,'s','niches'],
        [1,16,'e','niches'],[1,18,'e','niches'],[1,20,'e','niches'],
        [4,23,'n','niches'],[6,23,'n','niches'],
      ],
      strips: [[5,14,5,21,'aisle']],
      lights: [[5.5,14.5,4,.55]],
    },
    catacomb: {
      faces: [[20,23,'n','ossuary'],[21,23,'n','ossuary'],[22,23,'n','ossuary'],[23,23,'n','ossuary'],
        [20,11,'s','ossuary'],[21,11,'s','ossuary'],[25,11,'s','ossuary'],[26,19,'w','ossuary']],
      strips: [[18,17,22,18,'ledgeX'],[20,21,22,22,'ledgeX']],
      lights: [[22,21.5,4,.55]],
    },
    chapel: {
      faces: [[12,6,'w','rooted'],[12,7,'w','rooted'],[12,8,'w','rooted'],[12,9,'w','rooted'],
        [3,4,'s','rooted'],[4,4,'s','rooted'],[8,4,'s','rooted'],[9,4,'s','rooted']],
      strips: [[7,7,9,8,'dais']],
      lights: [[8.5,7.5,3,.52]],
    },
    sanctuary: {
      faces: [[17,1,'s','choir'],[18,1,'s','choir'],[19,1,'s','choir'],[20,1,'s','choir'],
        [21,1,'s','choir'],[12,4,'e','choir'],[27,4,'w','choir'],[27,6,'w','choir']],
      strips: [[19,2,19,8,'aisle'],[18,2,20,3,'dais']],
      lights: [[19.5,2.5,4,.54]],
    },
    nave: {
      faces: [[29,14,'w','waterline'],[29,15,'w','waterline'],[29,16,'w','waterline'],[29,18,'w','waterline'],
        [26,14,'e','waterline'],[26,15,'e','waterline'],[27,12,'s','waterline'],[28,12,'s','waterline']],
      strips: [[27,13,27,21,'grate']],
      lights: [[28,14,3,.55]],
    },
    salt: {
      faces: [[42,14,'e','workshop'],
        [50,13,'w','workshop'],[50,14,'w','workshop'],[50,15,'w','workshop'],
        [48,3,'s','workshop'],[49,3,'s','workshop'],[36,2,'s','workshop']],
      strips: [[45,12,48,14,'drain'],[35,4,36,6,'drain']],
      lights: [[47.5,13.5,4,.48]],
    },
    archive: {
      faces: [[54,9,'e','stacks'],[54,10,'e','stacks'],[54,11,'e','stacks'],
        [58,12,'s','stacks'],[59,12,'s','stacks'],[64,8,'s','stacks'],
        [61,8,'s','stacks'],[62,8,'s','stacks']],
      strips: [[60,9,62,11,'dais'],[55,14,64,14,'ledgeX']],
      lights: [[61.5,10.5,3,.6]],
    },
    garden: {
      faces: [[37,25,'s','trellis'],[38,25,'s','trellis'],[39,25,'s','trellis'],[41,25,'s','trellis'],
        [46,27,'s','trellis'],[50,31,'w','trellis'],[50,32,'w','trellis'],[50,33,'w','trellis']],
      strips: [[38,26,40,28,'beds'],[45,36,48,37,'beds']],
      lights: [[39,27,3.6,.68],[47.6,37.2,2.7,.46]],
    },
    soundings: {
      faces: [[66,25,'s','conduits'],[67,25,'s','conduits'],[68,25,'s','conduits'],[69,25,'s','conduits'],
        [70,27,'w','conduits'],[70,28,'w','conduits'],[70,29,'w','conduits'],
        ],
      strips: [[68,26,68,29,'grate'],[56,28,56,35,'grate']],
      lights: [[67.7,27.1,3,.53]],
    },
    sky: {
      faces: [[38,47,'s','observatory'],[39,47,'s','observatory'],[40,47,'s','observatory'],
        [41,47,'s','observatory'],[42,47,'s','observatory'],[43,47,'s','observatory'],
        [38,52,'e','observatory'],[38,53,'e','observatory'],[44,53,'w','observatory']],
      strips: [[39,52,43,55,'orbit']],
      lights: [[41.5,53.5,4,.62],[40.5,48.5,4,.5]],
    },
  };

  const landmarks = [
    [22.6,22.6,'catacomb','ossuary',1.28],
    [8.7,6.8,'chapel','broken',1.28],
    [18.65,3,'sanctuary','needle',1.22],
    [20.35,3,'sanctuary','needle',1.22],
    [46.6,6.9,'salt','crane',1.55],
    [46.2,14.7,'salt','basin',.85],
    [62.1,11.65,'archive','lectern',.88],
    [48.1,37.7,'garden','chair',.67],
    [48.9,33.55,'garden','hollowTree',1.52],
    [68.6,32.05,'soundings','weight',1.35],
    [34.8,51.4,'sky','mirror',.94],
    [49.15,53.25,'sky','mirror',.94],
  ];

  function bake(grid, fixtures) {
    return grid.map((row, y) => row.map((_, x) => {
      let light=0;
      for(const fixture of fixtures){
        const d=Math.hypot(fixture.x-x-.5,fixture.y-y-.5);
        light+=Math.max(0,1-d/fixture.radius)**2*fixture.power;
      }
      return Math.min(1,light);
    }));
  }

  function surface(name,u,v,ceiling) {
    const edge=u===0||v===0;
    const diamond=Math.abs(u-16)+Math.abs(v-16);
    const crack=(v>6&&v<25&&u===9+((v*3>>2)%9))||
      (u>13&&u<24&&v===21-(u>>2));
    const grain=((u*17^v*29^(u*v))&15)*.004;
    if(ceiling){
      const vault=Math.abs(u-16)===Math.min(v,32-v);
      return (edge?.27:vault?.6:.38)+grain;
    }
    if(name==='nave'){
      const ripple=(u+v*2+((u>>2)&3))%19;
      return (ripple===1?1.27:ripple<4?.92:.51)+grain;
    }
    if(name==='catacomb'){
      const joint=(v&15)===0||((u+((v>>4)*8))&15)===0;
      return (joint?.31:crack?.47:(u+v*3)%17===2?1.11:.75)+grain;
    }
    if(name==='chapel')return (edge?.33:crack?.42:diamond===11?.98:diamond<10?.64:.77)+grain;
    if(name==='sanctuary')return (edge?.44:diamond===12||diamond===10?1.18:crack?.48:.75)+grain;
    return (edge?.32:u===1||v===1?1.1:crack?.45:.78)+grain;
  }

  const surfaceColors=Object.fromEntries(Object.entries(materials).map(([name,material])=>{
    const layers=[false,true].map(ceiling=>{
      const colors=new Uint8Array(32*32*3);
      for(let v=0;v<32;v++)for(let u=0;u<32;u++){
        const scale=surface(name,u,v,ceiling);
        colors.set(material.floor.map(channel=>channel*scale),(v*32+u)*3);
      }
      return colors;
    });
    return [name,layers];
  }));
  function architecturalFloor(area, style) {
    const colors = surfaceColors[area][0].slice();
    for (let v = 0; v < 32; v++) for (let u = 0; u < 32; u++) {
      const rim = u === 2 || u === 29;
      const joint = (v & 15) === 0;
      let shade;
      switch (style) {
        case 'ledgeX': shade = v === 2 || v === 29 ? 1.45 : u % 16 === 0 ? .60 : 1.06; break;
        case 'grate': shade = rim ? 1.54 : v % 8 < 2 ? 1.09 : .57; break;
        case 'drain': shade = u < 11 || u > 20 ? 1.17 : u === 11 || u === 20 ? 1.32 : .56; break;
        case 'beds': shade = rim || v === 2 || v === 29 ? 1.48 : .82 + ((u * 3 + v) % 7) * .03; break;
        case 'orbit': {
          const radius = Math.hypot(u - 15.5, v - 15.5);
          shade = Math.abs(radius - 13) < .8 || Math.abs(radius - 7) < .65 ? 1.52 : 1.06;
          break;
        }
        case 'dais': shade = rim || v === 2 || v === 29 ? 1.38 : 1.19; break;
        default: shade = rim ? 1.35 : joint ? .66 : 1.13;
      }
      const offset = (v * 32 + u) * 3;
      for (let channel = 0; channel < 3; channel++) colors[offset + channel] *= shade;
    }
    return colors;
  }

  return { materials, surfaceColors, bake, architecture, architecturalFloor, landmarks };
})();
