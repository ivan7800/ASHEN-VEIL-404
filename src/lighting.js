/* Room palettes, tile patterns and baked fixture weights. */
const VeilLighting = (() => {
  const materials = {
    crypt: { floor:[95,81,94], fog:[15,10,20] },
    catacomb: { floor:[49,84,83], fog:[5,20,26] },
    chapel: { floor:[94,61,108], fog:[18,8,28] },
    sanctuary: { floor:[118,76,81], fog:[26,10,18] },
    nave: { floor:[55,108,105], fog:[4,23,28] },
  };

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
  return { materials, surfaceColors, bake };
})();
