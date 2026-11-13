/* The annexes share the original raycasting world and have independent floor plans. */
const VeilExpedition = (() => {
  const wings = [
    {
      id:'salt', name:'PATIO DE LA SAL', material:'salt', x:32, y:2, entry:[6.5,22.45], title:'Bajar al Patio de la Sal',
      rooms:[[8,14,10,17],[2,10,7,15],[2,5,5,10],[2,1,7,5],[7,2,13,3],[13,2,17,7],[11,7,16,9],[11,9,17,14],[7,13,11,14]],
      barriers:[['saltLow',10,2],['saltLow',10,3],['saltCrane',13,7],['saltCrane',14,7],['saltCrane',15,7],['saltCrane',16,7],['saltCrane',17,7],['saltCrane',10,13],['saltCrane',10,14]],
      props:[[9,15,'arch',1.5],[3,12,'coffin',1.15],[5,9,'brazier',.8],[4,2,'urn',.8],[16,5,'chains',1.3],[16.9,13.4,'saltPillar',.72]],
      stations:[
        ['saltMason',4.5,12.5,'El Cantero sentado','Lavábamos la sal con agua dulce. Luego hubo un día en que el agua recordó el mar. Empieza por la pila baja. La segunda está junto a la grúa.'],
        ['saltLow',4.5,3.5,'Lavar la pila baja','La sal se desprende en láminas. Debajo hay una huella de seis dedos.'],
        ['saltCrane',15.5,5.5,'Lavar la pila de la grúa','La grúa gira hacia el nicho del sur. Dentro hay algo que la sal no pudo conservar.',['saltLow']],
        ['saltPrint',15.5,12.5,'Recoger la impronta de sal','La impronta conserva el número del legajo donde se registró tu entierro.',['saltCrane'],80],
        ['saltEye',3.5,8.5,'Mirar el pozo seco','Tu reflejo tarda en levantar la cabeza. Decides no esperar a que lo haga.'],
      ],
    },
    {
      id:'archive', name:'ARCHIVO DE LOS AUSENTES', material:'archive', x:52, y:2, entry:[24.6,12.55], title:'Entrar en el Archivo',
      rooms:[[8,14,10,17],[3,11,15,14],[3,6,5,11],[1,3,7,6],[7,4,13,5],[13,2,17,10],[8,9,13,10],[8,7,10,9],[6,7,8,7],[10,7,12,7]],
      barriers:[['archiveKeep',7,7],['archiveErase',11,7]],
      props:[[9,15,'arch',1.4],[4,10,'chains',1],[3.1,4.1,'ledger',1.3],[15,4,'banner',1.5],[11,10,'brazier',.8]],
      stations:[
        ['archiveClerk',6.5,12.5,'La Archivera sin párpados','Alguien ha tachado a todos los que siguen vivos. Tengo dos copias. En una falta el nombre. En la otra falta el muerto. Busca las dos antes de elegir.'],
        ['archiveName',3.5,4.5,'Leer la copia del nombre','La línea del nombre sigue húmeda. Tu mano reconoce la caligrafía.'],
        ['archiveBody',16.5,4.5,'Leer la copia del cuerpo','Medida del ataúd: la anchura exacta de la puerta del santuario.'],
        ['archiveKeep',8.5,7.5,'Conservar el nombre','La Archivera te reconoce por primera vez. Suscribe el acta con tu nombre.',['archiveName','archiveBody'],90,'archiveChoice'],
        ['archiveErase',10.5,7.5,'Borrar el nombre','Al volver la cabeza, la Archivera ya no está. Te ha dejado el acta debajo del asiento.',['archiveName','archiveBody'],90,'archiveChoice'],
        ['archiveSeal',6.5,7.5,'Examinar el sello del acta','La cera reconoce la huella de sal. Debajo, tu nombre figura en el registro de entradas.',['archiveKeep','saltPrint'],65],
        ['archiveGap',12.5,7.5,'Examinar el acta vacía','Falta el nombre, pero no la fecha. La cera reconoce la huella de sal.',['archiveErase','saltPrint'],65],
      ],
    },
    {
      id:'garden', name:'HUERTO DE LAS VOCES', material:'garden', x:32, y:24, entry:[3.5,5.5], title:'Cruzar al Huerto de las Voces',
      rooms:[[8,14,10,17],[2,12,16,14],[2,5,5,12],[2,2,9,5],[9,4,15,6],[14,5,17,11],[9,10,17,11],[8,8,10,11]],
      props:[[9,15,'roots',1.65],[3,9,'fungus',1.25],[7.7,3.25,'tree',1.75],[16,7,'roots',1.45],[9,9,'stainedglass',1.4]],
      stations:[
        ['gardenKeeper',4.5,12.5,'La Jardinera de espaldas','No sé cuánto tiempo llevo sentada. El árbol blanco y el árbol hueco recuerdan voces distintas. Escúchalos de cerca.'],
        ['gardenWhite',6.5,3.5,'Escuchar al árbol blanco','Se oye una canción de cuna pronunciada al revés. La última palabra es «aquí».'],
        ['gardenHollow',16.5,8.5,'Escuchar al árbol hueco','Aquí. La palabra sale de la boca de alguien que todavía está llegando.'],
        ['gardenFruit',9.5,8.5,'Recoger el fruto de vidrio','La semilla queda en tu diario. Tu pulso sostiene mejor el éter.',['gardenWhite','gardenHollow'],70],
        ['gardenChair',15.5,13.5,'Examinar la silla vacía','Una silla para quien venga a escuchar el huerto dentro de cien años. Todavía está caliente.'],
      ],
    },
    {
      id:'soundings', name:'ESTACIÓN DE SONDAS', material:'soundings', x:52, y:24, entry:[28.45,21.45], title:'Descender a la Estación de Sondas',
      rooms:[[8,14,10,17],[2,11,16,14],[2,4,5,11],[2,2,9,4],[8,4,10,9],[10,7,16,9],[14,2,17,7]],
      barriers:[['soundingsIntake',8,5],['soundingsIntake',9,5],['soundingsIntake',10,5],['soundingsWeight',14,6],['soundingsWeight',15,6],['soundingsWeight',16,6],['soundingsWeight',17,6]],
      props:[[9,15,'chains',1.65],[3,10,'urn',.85],[4,3,'brazier',1],[9,6,'arch',1.4],[17.5,3.55,'gauge',.82]],
      stations:[
        ['soundingsGauge',4.5,12.5,'Leer el manómetro','La aguja se hunde cada vez que la miras. Abre la toma de poniente antes de equilibrar el contrapeso.'],
        ['soundingsIntake',4.5,3.5,'Abrir la toma de poniente','Las tuberías dejan de palpitar. El ruido baja hacia el contrapeso.'],
        ['soundingsWeight',15.5,8.5,'Equilibrar el contrapeso','El agua se queda quieta contra la pared, como si hubiera olvidado caer.',['soundingsIntake']],
        ['soundingsChart',16.5,3.5,'Recoger la carta de mareas','La carta registra una marea de piedra. En el margen dibujaron la lente de la cámara que hay junto al santuario.',['soundingsWeight'],100],
        ['soundingsBell',9.5,6.5,'Tocar el timbre sin badajo','Suena al otro lado de la pared. Otro timbre le responde, más abajo.'],
      ],
    },
    {
      id:'sky', name:'CÁMARA DEL CIELO INMÓVIL', material:'sky', x:32, y:46, entry:[25.5,8.45], title:'Entrar en la Cámara del Cielo',
      rooms:[[8,14,10,17],[2,10,16,14],[2,3,5,10],[2,2,15,4],[14,4,17,10],[7,6,11,9],[8,9,10,10]],
      props:[[9,15,'arch',1.5],[3,8,'brazier',.8],[8,3,'stainedglass',1.65],[16,8,'chains',1.5],[10.75,6.85,'orrery',1.05]],
      stations:[
        ['skyWatcher',5.5,12.5,'El Astrónomo de yeso','El espejo oscuro ha de mirar al fondo. El claro, hacia arriba. La lente también necesita la carta de mareas de la Estación de Sondas.'],
        ['skyDark',3.5,5.5,'Girar el espejo oscuro','Solo refleja la sala cuando le das la espalda.'],
        ['skyLight',16.5,7.5,'Girar el espejo claro','En el reflejo hay una puerta abierta donde aquí solo ves piedra.'],
        ['skyLens',9.5,7.5,'Leer la lente inmóvil','El ojo del Vigía no mira hacia ti. Está intentando cerrar algo detrás de ti. La carta de mareas señala el instante en que abrirá de nuevo.',['skyDark','skyLight','soundingsChart'],110],
        ['skyStar',8.5,3.5,'Mirar la estrella clavada','Una clavija de hierro sostiene la luz. Hay marcas de intentos anteriores de arrancarla.'],
      ],
    },
  ];
  const barriers=wings.flatMap(wing=>(wing.barriers??[]).map(([id,x,y])=>({id,x:wing.x+x,y:wing.y+y})));
  const areas = Object.fromEntries(wings.map(wing=>[wing.material,wing.name]));
  const stations = wings.flatMap(wing=>wing.stations.map(([id,x,y,label,text,requires=[],reward=0,choice])=>({
    id,x:wing.x+x,y:wing.y+y,label,text,requires,reward,choice,kind:'discovery',active:true,
  })));
  const doors = wings.flatMap(wing=>{
    const inside=[wing.x+9.5,wing.y+16.3];
    return [
      {id:wing.id+'In',kind:'passage',x:wing.entry[0],y:wing.entry[1],label:wing.title,to:inside,angle:-Math.PI/2,active:true},
      {id:wing.id+'Out',kind:'passage',x:inside[0],y:inside[1]+.85,label:'Regresar por el pasadizo',to:wing.entry,angle:Math.PI/2,active:true},
    ];
  });
  function at(x,y){
    return wings.find(wing=>x>=wing.x-1&&x<wing.x+19&&y>=wing.y-1&&y<wing.y+19);
  }
  return {wings,areas,stations,doors,barriers,at};
})();
