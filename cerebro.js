/* ══════════════════════════════════════════════════════════════════
   CEREBRO.JS — Motor de conocimiento de trámites
   Bóveda Legal · Fátima Caldea y familia
   Guías paso a paso, campo por campo, con texto para audio.
   ── Cómo actualizar: edita solo este archivo. Cada guía es un objeto
      con {id, titulo, pais, portal, url, resumen, requisitos[], pasos[]}.
      Cada paso: {t: título, d: explicación (se lee en audio), campo?, ejemplo?}
   ══════════════════════════════════════════════════════════════════ */
window.CEREBRO = {
  version: '2026.07',
  actualizado: '1 de julio de 2026',

  // ── VENEZUELA ─────────────────────────────────────────────────
  guias: [
    {
      id: 'saime-pasaporte-primera',
      pais: 've',
      cat: 'Pasaporte',
      titulo: 'Pasaporte por primera vez (SAIME)',
      portal: 'SAIME',
      url: 'https://pasaporte.saime.gob.ve',
      resumen: 'Para tus hijas que aún no tienen pasaporte. Se hace todo en línea en el portal del SAIME y luego se acude a la cita con los documentos originales.',
      requisitos: [
        'Cédula de identidad venezolana vigente',
        'Correo electrónico personal activo',
        'Datos exactos como aparecen en la partida de nacimiento',
        'Medio de pago habilitado por el SAIME (según el portal)'
      ],
      pasos: [
        { t: 'Activa la VPN primero', d: 'Antes de entrar, si estás en España activa tu VPN en un servidor de Venezuela. Si ya estás en Venezuela, no necesitas VPN.', campo: null },
        { t: 'Crea tu usuario', d: 'Entra en el portal del SAIME y pulsa Registrarse. Escribe tu número de cédula sin puntos, tu correo electrónico y una contraseña que puedas recordar.', campo: 'Cédula, correo y contraseña', ejemplo: 'Cédula: 12345678 · Correo: tunombre@gmail.com' },
        { t: 'Confirma tu correo', d: 'El SAIME te envía un enlace a tu correo. Ábrelo y confirma tu cuenta antes de continuar.', campo: null },
        { t: 'Inicia sesión y elige Pasaporte', d: 'Entra con tu cédula y contraseña. En el menú elige la opción de Pasaporte y luego Solicitud nueva o primera vez.', campo: null },
        { t: 'Rellena tus datos personales', d: 'Escribe tu nombre y apellidos tal como aparecen en tu partida de nacimiento. Revisa que no falte ninguna letra ni acento.', campo: 'Nombres y apellidos', ejemplo: 'Escríbelos idénticos a la partida de nacimiento' },
        { t: 'Fecha y lugar de nacimiento', d: 'Introduce tu fecha de nacimiento en el formato día, mes y año. Selecciona el estado y el municipio donde naciste.', campo: 'Fecha y lugar de nacimiento' },
        { t: 'Dirección de residencia', d: 'Indica la dirección donde vives actualmente en Venezuela. Si estás fuera, usa la última dirección o la de un familiar de confianza.', campo: 'Dirección actual' },
        { t: 'Elige la sede y la cita', d: 'Selecciona la oficina del SAIME más cercana. Luego escoge el día y la hora disponibles para tu cita.', campo: 'Sede, día y hora' },
        { t: 'Realiza el pago', d: 'Paga el arancel con el método que te muestre el portal. Guarda el comprobante o haz una captura de pantalla del pago.', campo: 'Pago del arancel' },
        { t: 'Imprime la planilla', d: 'Descarga e imprime la planilla de solicitud y el comprobante de la cita. Los necesitas el día de tu cita.', campo: null },
        { t: 'Acude a la cita', d: 'Ve a la sede el día indicado con tu cédula original, la planilla impresa y el comprobante de pago. Allí te toman la foto y las huellas.', campo: null }
      ]
    },
    {
      id: 'saime-pasaporte-vencido',
      pais: 've',
      cat: 'Pasaporte',
      titulo: 'Renovar pasaporte vencido o prórroga (SAIME)',
      portal: 'SAIME',
      url: 'https://pasaporte.saime.gob.ve',
      resumen: 'Cuando ya tuviste pasaporte y se venció. Puedes pedir un pasaporte nuevo o una prórroga, según lo que ofrezca el portal.',
      requisitos: [
        'Pasaporte anterior (aunque esté vencido)',
        'Cédula de identidad vigente',
        'Usuario del SAIME (el mismo de antes, si ya tienes)'
      ],
      pasos: [
        { t: 'Activa la VPN si estás en España', d: 'Recuerda: desde España activa la VPN en servidor de Venezuela. En Venezuela no hace falta.', campo: null },
        { t: 'Inicia sesión en el SAIME', d: 'Entra con tu cédula y contraseña. Si olvidaste la contraseña, usa la opción de recuperarla con tu correo.', campo: 'Cédula y contraseña' },
        { t: 'Elige renovación o prórroga', d: 'En el menú de pasaporte selecciona Renovación. El sistema te dirá si te corresponde pasaporte nuevo o prórroga.', campo: null },
        { t: 'Verifica tus datos', d: 'Revisa que tus datos personales sigan correctos. Corrige la dirección si te has mudado.', campo: 'Datos personales y dirección' },
        { t: 'Selecciona cita y paga', d: 'Escoge sede, día y hora, y paga el arancel. Guarda el comprobante.', campo: 'Cita y pago' },
        { t: 'Imprime y acude', d: 'Imprime la planilla y ve a la cita con el pasaporte vencido, la cédula y el comprobante.', campo: null }
      ]
    },
    {
      id: 'saime-pasaporte-menor',
      pais: 've',
      cat: 'Pasaporte',
      titulo: 'Pasaporte de menores de edad (SAIME)',
      portal: 'SAIME',
      url: 'https://pasaporte.saime.gob.ve',
      resumen: 'Para tus nietos. Lo tramita el padre, la madre o el representante legal. Ambos padres deben autorizar.',
      requisitos: [
        'Partida de nacimiento del menor',
        'Cédula del menor (si ya la tiene) o de los representantes',
        'Cédulas de ambos padres',
        'Autorización de ambos padres'
      ],
      pasos: [
        { t: 'Activa la VPN si estás fuera', d: 'Desde España, VPN en Venezuela. En Venezuela no hace falta.', campo: null },
        { t: 'Entra con el usuario del representante', d: 'El trámite del menor se hace desde la cuenta del padre, madre o representante. Inicia sesión.', campo: 'Cuenta del representante' },
        { t: 'Elige Pasaporte de menor', d: 'Selecciona la opción de menor de edad y añade al niño o niña con su número de cédula o partida.', campo: 'Datos del menor' },
        { t: 'Datos del menor', d: 'Escribe el nombre completo, la fecha de nacimiento y el lugar de nacimiento del menor, igual que en la partida.', campo: 'Nombre, fecha y lugar del menor' },
        { t: 'Datos de los padres', d: 'Introduce los nombres y cédulas del padre y de la madre. Ambos deben constar como autorizantes.', campo: 'Datos de los padres' },
        { t: 'Cita y pago', d: 'Escoge sede, día y hora, y paga el arancel del menor.', campo: 'Cita y pago' },
        { t: 'Acude con el menor', d: 'El niño o niña debe ir en persona a la cita con su partida original y las cédulas de los padres. Le toman foto y huellas si la edad lo permite.', campo: null }
      ]
    },
    {
      id: 've-antecedentes',
      pais: 've',
      cat: 'Antecedentes',
      titulo: 'Antecedentes penales de Venezuela',
      portal: 'Ministerio de Interior (MPPRIJP)',
      url: 'https://antecedentes.mpprijp.gob.ve',
      resumen: 'Certificado que pide España para nacionalidad y otros trámites. Se solicita en línea y luego se apostilla.',
      requisitos: ['Cédula de identidad vigente', 'Correo electrónico', 'Datos de pasaporte (si lo piden)'],
      pasos: [
        { t: 'Activa la VPN si estás en España', d: 'Desde España, VPN en Venezuela.', campo: null },
        { t: 'Entra al portal de antecedentes', d: 'Accede al sistema de antecedentes penales y regístrate o inicia sesión con tu cédula.', campo: 'Cédula' },
        { t: 'Rellena la solicitud', d: 'Completa tus datos personales y el motivo. Si es para España, indícalo.', campo: 'Datos y motivo' },
        { t: 'Descarga el certificado', d: 'El sistema genera el certificado en PDF. Descárgalo y guárdalo.', campo: null },
        { t: 'Apostíllalo', d: 'Lleva el certificado al portal de apostilla del MPPRE para que tenga validez en España.', campo: null }
      ]
    },
    {
      id: 've-apostilla',
      pais: 've',
      cat: 'Apostilla',
      titulo: 'Apostilla electrónica de documentos (MPPRE)',
      portal: 'MPPRE — Legalización y Apostilla',
      url: 'https://legalizacionmppre.gob.ve',
      resumen: 'La apostilla hace que tus documentos venezolanos (partidas, antecedentes, títulos) sean válidos en España.',
      requisitos: ['Documento a apostillar en PDF', 'Cédula', 'Correo electrónico'],
      pasos: [
        { t: 'Activa la VPN si estás en España', d: 'Desde España, VPN en Venezuela.', campo: null },
        { t: 'Entra al portal de apostilla', d: 'Accede al sistema de legalización y apostilla del MPPRE y regístrate.', campo: 'Cédula y correo' },
        { t: 'Sube el documento', d: 'Carga el documento que quieres apostillar. Debe estar firmado o emitido digitalmente por el organismo correspondiente.', campo: 'Documento PDF' },
        { t: 'Selecciona la cita', d: 'Escoge la sede y la fecha si el sistema lo requiere, o continúa en línea.', campo: 'Cita/sede' },
        { t: 'Paga y descarga', d: 'Paga el arancel y descarga la apostilla electrónica. Verifica el código QR de validez.', campo: 'Pago' }
      ]
    },
    {
      id: 've-partida',
      pais: 've',
      cat: 'Registros',
      titulo: 'Partida de nacimiento (SAREN)',
      portal: 'SAREN',
      url: 'https://www.saren.gob.ve',
      resumen: 'Copia certificada de la partida de nacimiento, necesaria para muchos trámites en España.',
      requisitos: ['Datos del registro civil donde se inscribió', 'Cédula'],
      pasos: [
        { t: 'Activa la VPN si estás fuera', d: 'Desde España, VPN en Venezuela.', campo: null },
        { t: 'Entra al SAREN', d: 'Accede al portal del SAREN y busca la opción de copias certificadas o registro civil.', campo: null },
        { t: 'Indica el registro', d: 'Señala el registro civil o la oficina donde se inscribió la partida y los datos de la persona.', campo: 'Datos del registro' },
        { t: 'Solicita la copia', d: 'Pide la copia certificada, paga si corresponde y agenda la retirada o descarga.', campo: 'Solicitud y pago' },
        { t: 'Apostíllala para España', d: 'Cuando tengas la copia certificada, apostíllala en el MPPRE.', campo: null }
      ]
    },
    // ── CONSULADO (Venezuela en España) ──────────────────────────
    {
      id: 'consulado-visado-reagrupacion',
      pais: 've',
      cat: 'Consulado',
      titulo: 'Visado / reagrupación en el Consulado (Barcelona)',
      portal: 'Consulado de Venezuela en Barcelona',
      url: 'https://www.consuladovenezuelabarcelona.com',
      resumen: 'Para traer a tus hijas y nietos, y para trámites de tu marido español. Se pide cita y se llevan los documentos apostillados.',
      requisitos: [
        'Pasaportes vigentes de las personas',
        'Actas apostilladas (nacimiento, matrimonio)',
        'Cédulas venezolanas',
        'Cita previa consular'
      ],
      pasos: [
        { t: 'Pide cita consular', d: 'Entra al portal del consulado de Barcelona y solicita cita previa. Anota el día y la hora.', campo: 'Cita previa' },
        { t: 'Reúne los documentos apostillados', d: 'Junta pasaportes, partidas y actas apostilladas, en original y copia.', campo: 'Documentos' },
        { t: 'Rellena la solicitud', d: 'Completa el formulario de visado o registro con los datos de cada persona tal como están en el pasaporte.', campo: 'Datos según pasaporte' },
        { t: 'Acude a la cita', d: 'Presenta todo en el consulado el día de la cita. Las personas deben ir según lo que indique el consulado.', campo: null },
        { t: 'Recoge la resolución', d: 'Espera la resolución y recoge el visado o el documento cuando te avisen.', campo: null }
      ]
    }
  ],

  buscar: function (q) {
    q = (q || '').toLowerCase();
    return this.guias.filter(function (g) {
      return (g.titulo + ' ' + g.cat + ' ' + g.resumen + ' ' + g.portal).toLowerCase().indexOf(q) !== -1;
    });
  },
  porId: function (id) { return this.guias.find(function (g) { return g.id === id; }); },
  porCategoria: function () {
    var cats = {};
    this.guias.forEach(function (g) { (cats[g.cat] = cats[g.cat] || []).push(g); });
    return cats;
  }
};
