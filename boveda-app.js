/* ══════════════════════════════════════════════════════════════════
   BÓVEDA LEGAL — Módulo Inteligente (añadido, no rompe nada existente)
   · PWA: instalar como app + funcionamiento sin conexión
   · Modo Venezuela: compuerta VPN inteligente para sitios .gob.ve
   · Audio explicativo con play / pausa reutilizable
   Autor: Arquitecto de Software · para Fátima Caldea
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Dominios de Venezuela (gobierno / consular) ──────────────────
  var VEN_HINTS = ['.gob.ve', 'gob.ve', 'saime', 'saren', 'mppre', 'cancilleria', 'consulado', 'venezolan', 'venezuela'];
  var ESP_HINTS = ['.gob.es', 'gob.es', 'seg-social', 'sepe', 'agenciatributaria', 'mjusticia', 'extranjeros', 'oepm.es', 'clave.gob.es'];

  function clasificarPais(url) {
    var u = (url || '').toLowerCase();
    // Consulado venezolano en España cuenta como trámite Venezuela
    for (var i = 0; i < VEN_HINTS.length; i++) if (u.indexOf(VEN_HINTS[i]) !== -1) return 've';
    for (var j = 0; j < ESP_HINTS.length; j++) if (u.indexOf(ESP_HINTS[j]) !== -1) return 'es';
    return 'otro';
  }

  // ── Detección de país (para saltar el VPN en Venezuela) ──────────
  // Señal fiable en el navegador: zona horaria. America/Caracas = está en Venezuela.
  function paisDispositivo() {
    var forzado = localStorage.getItem('bv_pais_forzado'); // 've' | 'es' | null
    if (forzado) return forzado;
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'America/Caracas') return 've';
      if (tz.indexOf('Europe/Madrid') !== -1 || tz.indexOf('Europe/') === 0) return 'es';
      if (tz.indexOf('America/') === 0) return 'am'; // otra zona de América
    } catch (e) {}
    return 'desconocido';
  }
  function estaEnVenezuela() { return paisDispositivo() === 've'; }
  window.bvPaisDispositivo = paisDispositivo;

  // ── Estado VPN (persistente) ─────────────────────────────────────
  function vpnOn() { return localStorage.getItem('bv_vpn') === 'on'; }
  function setVpn(on) {
    localStorage.setItem('bv_vpn', on ? 'on' : 'off');
    renderVpnPill();
  }

  // ── Audio play / pausa reutilizable ──────────────────────────────
  var BVAudio = {
    actual: null,
    hablar: function (texto, btn) {
      if (!('speechSynthesis' in window)) { alert('Tu navegador no soporta lectura por voz. Usa Chrome o Edge.'); return; }
      // Si este mismo botón está sonando → pausar/parar
      if (this.actual === btn && speechSynthesis.speaking) {
        speechSynthesis.cancel(); this._reset(); return;
      }
      speechSynthesis.resume(); speechSynthesis.cancel(); this._reset();
      var u = new SpeechSynthesisUtterance(String(texto).slice(0, 600));
      u.lang = 'es-ES'; u.rate = 0.96; u.pitch = 1;
      try { var vs = speechSynthesis.getVoices() || []; var es = vs.filter(function (v) { return /^es/i.test(v.lang); }); if (es.length) u.voice = es.find(function (v) { return /female|mujer|m[oó]nica|paulina|helena|laura|luc[ií]a/i.test(v.name); }) || es[0]; } catch (e) {}
      var self = this;
      u.onend = function () { self._reset(); };
      u.onerror = function () { self._reset(); };
      this.actual = btn;
      if (btn) { btn.dataset.playing = '1'; self._icon(btn, '⏸'); }
      setTimeout(function () { speechSynthesis.speak(u); }, 45);
    },
    _icon: function (btn, glyph) {
      var s = btn.querySelector('.bv-audio-ic'); if (s) s.textContent = glyph;
      else btn.textContent = glyph + (btn.dataset.label ? ' ' + btn.dataset.label : '');
    },
    _reset: function () {
      if (this.actual) { this.actual.dataset.playing = ''; this._icon(this.actual, '🔊'); }
      this.actual = null;
    }
  };
  window.BVAudio = BVAudio;

  // Botón de audio reutilizable: <button> con play/pausa
  function botonAudio(texto, etiqueta) {
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.label = etiqueta || '';
    b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#122542;color:#e9d9a8;border:1.5px solid #C9A84C;border-radius:20px;padding:6px 13px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;';
    b.innerHTML = '<span class="bv-audio-ic">🔊</span>' + (etiqueta ? '<span>' + etiqueta + '</span>' : '');
    b.onclick = function () { BVAudio.hablar(texto, b); };
    return b;
  }
  window.bvBotonAudio = botonAudio;

  // ── Compuerta / Modal Modo Venezuela ─────────────────────────────
  var VPN_APPS = [
    { n: 'Proton VPN', d: 'Gratis · fiable · servidores LatAm', u: 'https://protonvpn.com/download' },
    { n: 'Windscribe', d: 'Plan gratis 10 GB/mes', u: 'https://windscribe.com/download' },
    { n: 'PureVPN', d: 'Tiene servidor en Venezuela', u: 'https://www.purevpn.com/es/' },
    { n: '1.1.1.1 (WARP)', d: 'Sencillo, de Cloudflare', u: 'https://one.one.one.one/' }
  ];

  function crearModal() {
    if (document.getElementById('bvVenModal')) return;
    var wrap = document.createElement('div');
    wrap.id = 'bvVenModal';
    wrap.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(10,15,25,.72);backdrop-filter:blur(3px);align-items:center;justify-content:center;padding:16px;';
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:16px;max-width:440px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 24px 70px rgba(0,0,0,.5);font-family:\'Segoe UI\',Arial,sans-serif;">' +
        '<div style="background:linear-gradient(135deg,#122542,#1c3660);padding:16px 18px;border-radius:16px 16px 0 0;display:flex;align-items:center;gap:12px;">' +
          '<div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(180deg,#fcd116 33%,#0033a0 33%,#0033a0 66%,#ce1126 66%);flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>' +
          '<div style="flex:1;"><div style="font-size:14px;font-weight:800;color:#fff;">Trámite de Venezuela detectado</div><div style="font-size:10px;color:#C9A84C;margin-top:2px;">Compuerta de seguridad · Modo Venezuela</div></div>' +
          '<button onclick="bvCerrarVen()" style="background:none;border:none;color:#8aa;font-size:20px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div style="padding:16px 18px;">' +
          '<div id="bvVenBody"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) cerrar(); });
  }

  var _pendingUrl = null;

  function abrirModalVen(url) {
    crearModal();
    _pendingUrl = url;
    var body = document.getElementById('bvVenBody');
    var yaOn = vpnOn();
    var explica = 'Vas a entrar en una página del gobierno de Venezuela. Estas webs pueden bloquear las conexiones que llegan desde España. Para evitarlo, activa tu aplicación de VPN y elige un servidor en Venezuela o en un país neutral de Latinoamérica, como Panamá o Colombia. Cuando la VPN esté encendida, marca la casilla de confirmación y pulsa continuar.';

    var appsHtml = VPN_APPS.map(function (a) {
      return '<button onclick="bvOpenReal(\'' + a.u + '\')" style="text-align:left;background:#f7f5ef;border:1.5px solid #e0d9cc;border-radius:9px;padding:9px 11px;cursor:pointer;display:flex;align-items:center;gap:9px;font-family:inherit;">' +
        '<span style="font-size:17px;">🛡️</span><span style="flex:1;"><span style="font-size:11.5px;font-weight:700;color:#1a1a1a;display:block;">' + a.n + '</span><span style="font-size:9.5px;color:#888;">' + a.d + '</span></span><span style="color:#2563EB;font-size:13px;">↗</span>' +
      '</button>';
    }).join('');

    body.innerHTML =
      '<p style="font-size:11.5px;line-height:1.7;color:#444;margin-bottom:10px;">Vas a entrar en una <b>página del Gobierno de Venezuela</b>. Estos portales suelen <b style="color:#DC2626;">bloquear las conexiones desde España</b>.</p>' +
      '<div id="bvVenAudioSlot" style="margin-bottom:12px;"></div>' +
      '<div style="background:#eef4ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:11px 12px;margin-bottom:12px;">' +
        '<div style="font-size:10.5px;font-weight:800;color:#1e40af;margin-bottom:4px;">🔒 Qué debes hacer</div>' +
        '<ol style="margin:0 0 0 16px;padding:0;font-size:10.5px;line-height:1.7;color:#334;">' +
          '<li>Abre tu app de <b>VPN</b>.</li>' +
          '<li>Conéctate a un servidor de <b>Venezuela</b> o de un país neutral (Panamá, Colombia, EE. UU.).</li>' +
          '<li>Vuelve aquí, confirma abajo y continúa.</li>' +
        '</ol>' +
      '</div>' +
      '<div style="font-size:9.5px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Apps de VPN recomendadas</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px;">' + appsHtml + '</div>' +
      '<label style="display:flex;align-items:flex-start;gap:9px;background:' + (yaOn ? '#f0fdf4' : '#fff8f0') + ';border:1.5px solid ' + (yaOn ? '#bbf7d0' : '#fcd9a5') + ';border-radius:10px;padding:11px 12px;cursor:pointer;margin-bottom:14px;">' +
        '<input type="checkbox" id="bvVpnConfirm" ' + (yaOn ? 'checked' : '') + ' onchange="bvToggleConfirm(this.checked)" style="width:17px;height:17px;margin-top:1px;accent-color:#27AE60;">' +
        '<span style="font-size:11px;line-height:1.6;color:#1a1a1a;font-weight:600;">Ya activé mi VPN en un servidor de <b>Venezuela</b> (o país neutral). Entiendo que sin VPN la página puede bloquearme.</span>' +
      '</label>' +
      '<div style="display:flex;gap:8px;">' +
        '<button onclick="bvCerrarVen()" style="flex:0 0 auto;padding:11px 16px;border-radius:9px;border:1.5px solid #e0d9cc;background:#f7f5ef;color:#555;font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' +
        '<button id="bvVenGo" onclick="bvContinuarVen()" ' + (yaOn ? '' : 'disabled') + ' style="flex:1;padding:11px 16px;border-radius:9px;border:none;background:' + (yaOn ? '#122542' : '#c9c4ba') + ';color:#fff;font-size:11.5px;font-weight:700;cursor:' + (yaOn ? 'pointer' : 'not-allowed') + ';font-family:inherit;">Continuar y abrir la página →</button>' +
      '</div>';

    document.getElementById('bvVenAudioSlot').appendChild(botonAudio(explica, 'Escuchar explicación'));
    // Recordatorio de credenciales guardadas (Bóveda VPN)
    try {
      var vv = JSON.parse(localStorage.getItem('bv_vpn_vault') || '{}');
      if (vv && (vv.prov || vv.user)) {
        var slot = document.getElementById('bvVenAudioSlot');
        var box = document.createElement('div');
        box.style.cssText = 'margin-top:10px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:9px;padding:9px 11px;font-size:10px;line-height:1.7;color:#14532d;';
        box.innerHTML = '<b>🛡️ Tu VPN guardada:</b> ' + (vv.prov || '') +
          (vv.user ? '<br>Usuario: <b>' + vv.user + '</b>' : '') +
          (vv.server ? '<br>Servidor: <b>' + vv.server + '</b>' : '') +
          (vv.cred ? '<br>Saldo: ' + vv.cred : '');
        slot.parentNode.insertBefore(box, slot.nextSibling);
      }
    } catch (e) {}
    document.getElementById('bvVenModal').style.display = 'flex';
  }

  function cerrar() {
    var m = document.getElementById('bvVenModal');
    if (m) m.style.display = 'none';
    if ('speechSynthesis' in window) { speechSynthesis.cancel(); BVAudio._reset(); }
    _pendingUrl = null;
  }

  window.bvCerrarVen = cerrar;
  window.bvToggleConfirm = function (on) {
    setVpn(on);
    var go = document.getElementById('bvVenGo');
    if (go) {
      go.disabled = !on;
      go.style.background = on ? '#122542' : '#c9c4ba';
      go.style.cursor = on ? 'pointer' : 'not-allowed';
    }
  };
  window.bvContinuarVen = function () {
    var url = _pendingUrl;
    cerrar();
    if (url) window.open(url, '_blank', 'noopener');
  };
  window.bvOpenReal = function (url) { window.open(url, '_blank', 'noopener'); };

  // Aviso al abrir sitio de España con VPN encendida
  function avisoEspanaVpn(url) {
    var seguir = confirm('⚠️ Tienes el Modo Venezuela / VPN activado.\n\nVas a entrar en una página de España. Es mejor APAGAR la VPN para trámites españoles.\n\n¿Continuar de todas formas?');
    if (seguir) { setVpn(false); window.open(url, '_blank', 'noopener'); }
  }

  // ── Interceptar abrirEnlace de toda la app ───────────────────────
  function instalarGate() {
    var original = (typeof window.abrirEnlace === 'function') ? window.abrirEnlace : function (u) { window.open(u, '_blank'); };
    window.abrirEnlace = function (url) {
      var pais = clasificarPais(url);
      // Si estás físicamente en Venezuela, NO se necesita VPN: abrir directo.
      if (pais === 've' && estaEnVenezuela()) { return original(url); }
      if (pais === 've') { abrirModalVen(url); return; }
      if (pais === 'es' && vpnOn()) { avisoEspanaVpn(url); return; }
      return original(url);
    };
  }

  // ── Píldora VPN + botón Instalar en la cabecera ──────────────────
  function renderVpnPill() {
    var pill = document.getElementById('bvVpnPill');
    if (!pill) return;
    var on = vpnOn();
    pill.style.background = on ? '#122542' : '#f7f5ef';
    pill.style.borderColor = on ? '#C9A84C' : '#e0d9cc';
    pill.style.color = on ? '#e9d9a8' : '#888';
    pill.innerHTML = '<span style="font-size:11px;">' + (on ? '🟢' : '⚪') + '</span><span>VPN ' + (on ? 'Venezuela' : 'apagado') + '</span>';
  }

  var deferredPrompt = null;

  function montarCabecera() {
    var host = document.querySelector('.hdr-right') || document.querySelector('.hdr .nav') || document.querySelector('.cr-area') || document.querySelector('.hdr') || document.querySelector('.topbar');
    if (!host || document.getElementById('bvVpnPill')) return;

    var pill = document.createElement('button');
    pill.id = 'bvVpnPill';
    pill.type = 'button';
    pill.title = 'Modo Venezuela / VPN — pulsa para cambiar';
    pill.style.cssText = 'display:inline-flex;align-items:center;gap:5px;border:1.5px solid #e0d9cc;border-radius:20px;padding:4px 11px;font-size:9.5px;font-weight:700;cursor:pointer;font-family:inherit;';
    pill.onclick = function () { setVpn(!vpnOn()); };

    var installBtn = document.createElement('button');
    installBtn.id = 'bvInstallBtn';
    installBtn.type = 'button';
    installBtn.textContent = '⬇ Instalar app';
    installBtn.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:#122542;color:#e9d9a8;border:1.5px solid #C9A84C;border-radius:20px;padding:5px 12px;font-size:9.5px;font-weight:700;cursor:pointer;font-family:inherit;';
    installBtn.onclick = async function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      } else {
        var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        alert(esIOS
          ? 'Para instalar en iPhone/iPad:\n\n1. Pulsa el botón Compartir (el cuadrito con la flecha ⬆, abajo en Safari).\n2. Baja y pulsa "Añadir a pantalla de inicio".\n3. Pulsa "Añadir". Aparecerá el icono del escudo.'
          : 'Para instalar la app:\n\n• Android / Chrome: menú ⋮ (arriba a la derecha) → "Instalar aplicación".\n• Ordenador / Chrome o Edge: icono de instalar en la barra de direcciones.\n\nNota: el instalador automático solo aparece al abrir la app desde tu web (https://), no al abrir el archivo suelto.');
      }
    };

    host.insertBefore(installBtn, host.firstChild);
    host.insertBefore(pill, host.firstChild);
    renderVpnPill();
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var b = document.getElementById('bvInstallBtn');
    if (b) b.style.display = 'inline-flex';
  });

  // ── Registro del Service Worker (solo en producción real) ───────
  function registrarSW() {
    if (!('serviceWorker' in navigator)) return;
    var host = location.hostname || '';
    var esProduccion = /fatimahairstudio/.test(host);
    if (esProduccion && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    } else {
      // En vista previa / desarrollo: limpiar cualquier SW pegado que cuelgue la página
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        rs.forEach(function (r) { r.unregister(); });
      }).catch(function () {});
    }
  }

  // ══ CENTRO INTELIGENTE (enlaces oficiales VE + seguimiento pasaporte) ══
  var ENLACES_VE = [
    { grupo: 'Documentos & Identidad', items: [
      { n: 'SAIME — Pasaporte y Cédula', u: 'http://www.saime.gob.ve', d: 'Citas de pasaporte, prórroga y cédula' },
      { n: 'SAREN — Registros y Notarías', u: 'http://www.saren.gob.ve', d: 'Partidas, poderes, actas y notarías' },
      { n: 'Apostilla / Legalización MPPRE', u: 'https://legalizacionmppre.gob.ve', d: 'Apostilla de documentos venezolanos' }
    ]},
    { grupo: 'Consulados de Venezuela en España', items: [
      { n: 'Consulado en Madrid', u: 'https://embajada-venezolana.es', d: 'Registro consular · visados · cédula' },
      { n: 'Consulado en Barcelona', u: 'https://www.consuladovenezuelabarcelona.com', d: 'Trámites consulares Cataluña' },
      { n: 'Consulado en Vigo', u: 'https://consuladovenezuelavigo.es', d: 'Galicia y noroeste' }
    ]},
    { grupo: 'España — trámites relacionados', items: [
      { n: 'Cl@ve — Identidad digital', u: 'https://clave.gob.es', d: 'Acceso a la administración española' },
      { n: 'Cita previa Extranjería', u: 'https://icp.administracionelectronica.gob.es', d: 'NIE, TIE, arraigo, reagrupación' },
      { n: 'Nacionalidad — Mº Justicia', u: 'https://sede.mjusticia.gob.es', d: 'Nacionalidad por residencia' }
    ]}
  ];

  function loadPas() { try { return JSON.parse(localStorage.getItem('bv_pasaporte') || '{}'); } catch (e) { return {}; } }
  function savePas(o) { localStorage.setItem('bv_pasaporte', JSON.stringify(o)); }

  var PAS_CHECK = [
    'Cédula de identidad vigente (o constancia)',
    'Cita solicitada en el portal SAIME',
    'Planilla de solicitud impresa',
    'Pago del arancel realizado',
    'Foto y datos biométricos (se toman en sede)',
    'Pasaporte anterior (si es renovación)'
  ];

  function estadoBadge(estado) {
    var map = { pendiente: ['#F59E0B', 'Pendiente'], progreso: ['#2563EB', 'En progreso'], listo: ['#7C3AED', 'Listo para recoger'], entregado: ['#059669', 'Entregado ✓'] };
    var m = map[estado] || map.pendiente;
    return '<span style="background:' + m[0] + ';color:#fff;border-radius:20px;padding:3px 10px;font-size:9.5px;font-weight:700;">' + m[1] + '</span>';
  }

  function diasCaducidad(fecha) {
    if (!fecha) return null;
    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var f = new Date(fecha + 'T00:00:00');
    return Math.round((f - hoy) / 86400000);
  }

  function renderCentro() {
    var body = document.getElementById('bvCentroBody');
    if (!body) return;
    var p = loadPas();
    var checks = p.checks || [];
    var hechos = checks.filter(Boolean).length;

    var enlacesHtml = ENLACES_VE.map(function (g) {
      return '<div style="margin-bottom:14px;"><div style="font-size:9.5px;font-weight:800;color:#C9A84C;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">' + g.grupo + '</div>' +
        g.items.map(function (it) {
          return '<button onclick="abrirEnlace(\'' + it.u + '\')" style="width:100%;text-align:left;background:#f7f5ef;border:1.5px solid #e6dfd0;border-radius:9px;padding:9px 11px;margin-bottom:6px;cursor:pointer;display:flex;align-items:center;gap:9px;font-family:inherit;">' +
            '<span style="flex:1;"><span style="font-size:11.5px;font-weight:700;color:#1a1a1a;display:block;">' + it.n + '</span><span style="font-size:9.5px;color:#999;">' + it.d + '</span></span><span style="color:#122542;font-size:14px;">→</span></button>';
        }).join('') + '</div>';
    }).join('');

    var dias = diasCaducidad(p.caducidad);
    var caducAviso = '';
    if (dias !== null) {
      var col = dias < 0 ? '#DC2626' : dias < 180 ? '#F59E0B' : '#059669';
      var txt = dias < 0 ? 'CADUCADO hace ' + Math.abs(dias) + ' días' : 'Caduca en ' + dias + ' días' + (dias < 180 ? ' — ¡renueva ya!' : '');
      caducAviso = '<div style="background:' + col + '15;border:1.5px solid ' + col + ';border-radius:8px;padding:8px 10px;font-size:10.5px;font-weight:700;color:' + col + ';margin-top:6px;">⏰ ' + txt + '</div>';
    }

    var checkHtml = PAS_CHECK.map(function (c, i) {
      return '<label style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid #f0ece2;cursor:pointer;">' +
        '<input type="checkbox" ' + (checks[i] ? 'checked' : '') + ' onchange="bvPasCheck(' + i + ',this.checked)" style="width:16px;height:16px;margin-top:1px;accent-color:#C9A84C;">' +
        '<span style="font-size:10.5px;line-height:1.5;color:#333;">' + c + '</span></label>';
    }).join('');

    var pasoAudio = 'Cómo pedir la cita del pasaporte en el SAIME, paso a paso. Uno: activa tu VPN de Venezuela antes de entrar. Dos: entra en la página del SAIME y crea o inicia tu usuario con tu cédula. Tres: elige la opción de pasaporte y selecciona nueva cita. Cuatro: escoge la sede, el día y la hora disponibles. Cinco: paga el arancel con los métodos que indique el portal. Seis: imprime la planilla y la constancia de la cita. Siete: acude a la sede el día indicado con tus documentos originales. Recuerda revisar la fecha de caducidad de tu pasaporte con tiempo.';

    // ── Guías desde el CEREBRO, agrupadas por categoría ──
    var guiasHtml = '';
    var pais = window.bvPaisDispositivo ? window.bvPaisDispositivo() : 'desconocido';
    var paisTxt = pais === 've' ? '🇻🇪 Estás en Venezuela — no necesitas VPN' : (pais === 'es' ? '🇪🇸 Estás en España — se activará el Modo Venezuela' : '🌐 Ubicación no detectada');
    guiasHtml += '<div style="background:#f7f5ef;border:1.5px solid #e6dfd0;border-radius:8px;padding:8px 11px;font-size:10px;font-weight:600;color:#555;margin-bottom:12px;">' + paisTxt + '</div>';
    if (window.CEREBRO) {
      var cats = window.CEREBRO.porCategoria();
      Object.keys(cats).forEach(function (cat) {
        guiasHtml += '<div style="font-size:9.5px;font-weight:800;color:#C9A84C;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 7px;">' + cat + '</div>';
        cats[cat].forEach(function (g) {
          guiasHtml += '<button onclick="bvAbrirGuia(\'' + g.id + '\')" style="width:100%;text-align:left;background:#fff;border:1.5px solid #e6dfd0;border-radius:9px;padding:10px 12px;margin-bottom:6px;cursor:pointer;display:flex;align-items:center;gap:9px;font-family:inherit;">' +
            '<span style="font-size:16px;">' + (g.pais === 've' ? '🇻🇪' : '🇪🇸') + '</span>' +
            '<span style="flex:1;"><span style="font-size:11.5px;font-weight:700;color:#1a1a1a;display:block;">' + g.titulo + '</span><span style="font-size:9.5px;color:#999;">' + g.pasos.length + ' pasos · audio paso a paso</span></span>' +
            '<span style="color:#122542;font-size:14px;">→</span></button>';
        });
      });
    } else {
      guiasHtml += '<div style="font-size:10.5px;color:#999;padding:12px;">Cargando el cerebro de conocimiento…</div>';
    }


    body.innerHTML =
      '<div style="display:flex;gap:5px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<button onclick="bvCentroTab(\'guias\')" id="bvTab_guias" class="bv-ctab" style="flex:1;min-width:calc(50% - 3px);padding:8px 4px;border-radius:8px;border:none;background:#122542;color:#fff;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">📘 Guías con audio</button>' +
        '<button onclick="bvCentroTab(\'enlaces\')" id="bvTab_enlaces" class="bv-ctab" style="flex:1;min-width:calc(50% - 3px);padding:8px 4px;border-radius:8px;border:1.5px solid #e0d9cc;background:#f7f5ef;color:#555;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">🔗 Enlaces oficiales</button>' +
        '<button onclick="bvCentroTab(\'pasaporte\')" id="bvTab_pasaporte" class="bv-ctab" style="flex:1;min-width:calc(50% - 3px);padding:8px 4px;border-radius:8px;border:1.5px solid #e0d9cc;background:#f7f5ef;color:#555;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">🪪 Mi pasaporte</button>' +
        '<button onclick="bvCentroTab(\'vpn\')" id="bvTab_vpn" class="bv-ctab" style="flex:1;min-width:calc(50% - 3px);padding:8px 4px;border-radius:8px;border:1.5px solid #e0d9cc;background:#f7f5ef;color:#555;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">🛡️ Bóveda VPN</button>' +
      '</div>' +
      '<div id="bvPanel_guias">' + guiasHtml + '</div>' +
      '<div id="bvPanel_enlaces" style="display:none;">' + enlacesHtml +
        '<div style="background:#eef4ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:9px 11px;font-size:9.5px;line-height:1.6;color:#1e40af;">🔒 Al abrir cualquier enlace de Venezuela, el sistema te pedirá activar el <b>Modo Venezuela / VPN</b> automáticamente (excepto si ya estás en Venezuela).</div>' +
      '</div>' +
      '<div id="bvPanel_pasaporte" style="display:none;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-size:11px;font-weight:700;color:#1a1a1a;">Estado del trámite</span>' + estadoBadge(p.estado) + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:14px;">' +
          ['pendiente','progreso','listo','entregado'].map(function (e) {
            var lbl = { pendiente:'Pendiente', progreso:'En curso', listo:'Listo', entregado:'Entregado' }[e];
            var on = p.estado === e;
            return '<button onclick="bvPasEstado(\'' + e + '\')" style="padding:7px 3px;border-radius:7px;border:1.5px solid ' + (on ? '#122542' : '#e0d9cc') + ';background:' + (on ? '#122542' : '#f7f5ef') + ';color:' + (on ? '#fff' : '#777') + ';font-size:9px;font-weight:700;cursor:pointer;font-family:inherit;">' + lbl + '</button>';
          }).join('') +
        '</div>' +
        '<div style="margin-bottom:14px;"><label style="font-size:10px;font-weight:700;color:#555;display:block;margin-bottom:5px;">Caducidad del pasaporte actual</label>' +
          '<input type="date" value="' + (p.caducidad || '') + '" onchange="bvPasCaducidad(this.value)" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;font-family:inherit;">' + caducAviso + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:11px;font-weight:700;color:#1a1a1a;">Checklist requisitos <span style="color:#C9A84C;">(' + hechos + '/' + PAS_CHECK.length + ')</span></span></div>' +
        '<div id="bvPasAudioSlot" style="margin-bottom:10px;"></div>' +
        checkHtml +
      '</div>' +
      '<div id="bvPanel_vpn" style="display:none;">' + vpnVaultHtml() + '</div>';

    if (document.getElementById('bvPasAudioSlot')) {
      document.getElementById('bvPasAudioSlot').appendChild(botonAudio(pasoAudio, 'Escuchar: cómo pedir cita SAIME'));
    }
  }

  window.bvCentroTab = function (t) {
    ['guias','enlaces','pasaporte','vpn'].forEach(function (k) {
      var panel = document.getElementById('bvPanel_' + k);
      var btn = document.getElementById('bvTab_' + k);
      var on = k === t;
      if (panel) panel.style.display = on ? 'block' : 'none';
      if (btn) {
        btn.style.background = on ? '#122542' : '#f7f5ef';
        btn.style.color = on ? '#fff' : '#555';
        btn.style.border = on ? 'none' : '1.5px solid #e0d9cc';
      }
    });
  };
  window.bvPasCheck = function (i, on) { var p = loadPas(); p.checks = p.checks || []; p.checks[i] = on; savePas(p); renderCentro(); window.bvCentroTab('pasaporte'); };
  window.bvPasEstado = function (e) { var p = loadPas(); p.estado = e; savePas(p); renderCentro(); window.bvCentroTab('pasaporte'); };
  window.bvPasCaducidad = function (f) { var p = loadPas(); p.caducidad = f; savePas(p); renderCentro(); window.bvCentroTab('pasaporte'); };

  // ══ GUÍA PASO A PASO con audio automático ════════════════════════
  var _guiaEstado = { id: null, paso: 0, autoAudio: true };

  window.bvAbrirGuia = function (id) {
    _guiaEstado = { id: id, paso: 0, autoAudio: true };
    renderGuia();
  };

  function renderGuia() {
    var g = window.CEREBRO && window.CEREBRO.porId(_guiaEstado.id);
    var body = document.getElementById('bvCentroBody');
    if (!g || !body) return;
    var i = _guiaEstado.paso;
    var paso = g.pasos[i];
    var total = g.pasos.length;
    var pct = Math.round(((i + 1) / total) * 100);

    body.innerHTML =
      '<button onclick="bvVolverGuias()" style="background:none;border:none;color:#122542;font-size:11px;font-weight:700;cursor:pointer;padding:0;margin-bottom:10px;font-family:inherit;">← Volver a las guías</button>' +
      '<div style="font-size:14px;font-weight:800;color:#1a1a1a;margin-bottom:3px;">' + (g.pais === 've' ? '🇻🇪 ' : '🇪🇸 ') + g.titulo + '</div>' +
      '<div style="font-size:9.5px;color:#999;margin-bottom:12px;">' + g.portal + ' · actualizado ' + (window.CEREBRO.actualizado || '') + '</div>' +
      // barra de progreso
      '<div style="height:6px;background:#eee;border-radius:6px;overflow:hidden;margin-bottom:4px;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#C9A84C,#122542);"></div></div>' +
      '<div style="font-size:9.5px;color:#888;margin-bottom:14px;">Paso ' + (i + 1) + ' de ' + total + '</div>' +
      // tarjeta del paso
      '<div style="background:#fff;border:1.5px solid #e6dfd0;border-left:4px solid #C9A84C;border-radius:10px;padding:14px;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;">' +
          '<div style="width:28px;height:28px;border-radius:50%;background:#122542;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (i + 1) + '</div>' +
          '<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:#1a1a1a;margin-bottom:5px;">' + paso.t + '</div>' +
          '<div style="font-size:11.5px;line-height:1.7;color:#444;">' + paso.d + '</div>' +
          (paso.campo ? '<div style="margin-top:9px;background:#eef4ff;border:1px solid #bfdbfe;border-radius:7px;padding:7px 10px;font-size:10px;color:#1e40af;"><b>Campo a rellenar:</b> ' + paso.campo + (paso.ejemplo ? '<br><span style="color:#555;">Ej: ' + paso.ejemplo + '</span>' : '') + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      // control audio automático
      '<label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:10.5px;color:#555;cursor:pointer;">' +
        '<input type="checkbox" ' + (_guiaEstado.autoAudio ? 'checked' : '') + ' onchange="bvGuiaAuto(this.checked)" style="width:16px;height:16px;accent-color:#C9A84C;"> Leer cada paso automáticamente en voz alta' +
      '</label>' +
      '<div id="bvGuiaAudioSlot" style="margin-bottom:14px;"></div>' +
      // navegación
      '<div style="display:flex;gap:8px;">' +
        (i > 0 ? '<button onclick="bvGuiaPaso(' + (i - 1) + ')" style="flex:0 0 auto;padding:11px 15px;border-radius:9px;border:1.5px solid #e0d9cc;background:#f7f5ef;color:#555;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;">← Anterior</button>' : '') +
        (i < total - 1
          ? '<button onclick="bvGuiaPaso(' + (i + 1) + ')" style="flex:1;padding:11px 15px;border-radius:9px;border:none;background:#122542;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;">Siguiente paso →</button>'
          : '<button onclick="abrirEnlace(\'' + g.url + '\')" style="flex:1;padding:11px 15px;border-radius:9px;border:none;background:#059669;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;">✓ Abrir el portal oficial →</button>') +
      '</div>';

    // botón de audio del paso + auto-reproducción
    var slot = document.getElementById('bvGuiaAudioSlot');
    var textoPaso = 'Paso ' + (i + 1) + '. ' + paso.t + '. ' + paso.d + (paso.ejemplo ? ' Por ejemplo: ' + paso.ejemplo : '');
    var btn = botonAudio(textoPaso, 'Escuchar este paso');
    slot.appendChild(btn);
    if (_guiaEstado.autoAudio) { setTimeout(function () { BVAudio.hablar(textoPaso, btn); }, 250); }
  }

  window.bvGuiaPaso = function (n) { _guiaEstado.paso = n; if ('speechSynthesis' in window) speechSynthesis.cancel(); renderGuia(); };
  window.bvGuiaAuto = function (on) { _guiaEstado.autoAudio = on; };
  window.bvVolverGuias = function () { if ('speechSynthesis' in window) speechSynthesis.cancel(); renderCentro(); window.bvCentroTab('guias'); };

  // ══ BÓVEDA VPN (guarda credenciales del proveedor en el dispositivo) ══
  function loadVpn() { try { return JSON.parse(localStorage.getItem('bv_vpn_vault') || '{}'); } catch (e) { return {}; } }
  function saveVpn(o) { localStorage.setItem('bv_vpn_vault', JSON.stringify(o)); }

  function vpnVaultHtml() {
    var v = loadVpn();
    return '<div style="background:#fff8f0;border:1.5px solid #fcd9a5;border-radius:9px;padding:11px 12px;margin-bottom:14px;font-size:10px;line-height:1.7;color:#7a5a20;">' +
        '<b>ℹ️ Cómo funciona.</b> Una app no puede encender la VPN sola (lo impide el sistema del teléfono). Aquí <b>guardas tus datos de acceso</b> del proveedor que compraste, y el sistema te los muestra al abrir un trámite de Venezuela para que conectes con un toque.' +
      '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#555;margin-bottom:4px;">Proveedor / servicio</div>' +
      '<input id="bvVpnProv" value="' + (v.prov || '') + '" placeholder="Ej: Proton VPN, Windscribe…" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;margin-bottom:9px;font-family:inherit;">' +
      '<div style="font-size:10px;font-weight:700;color:#555;margin-bottom:4px;">Usuario / correo</div>' +
      '<input id="bvVpnUser" value="' + (v.user || '') + '" placeholder="Tu usuario" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;margin-bottom:9px;font-family:inherit;">' +
      '<div style="font-size:10px;font-weight:700;color:#555;margin-bottom:4px;">Clave / contraseña</div>' +
      '<input id="bvVpnKey" type="password" value="' + (v.key || '') + '" placeholder="Tu clave" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;margin-bottom:9px;font-family:inherit;">' +
      '<div style="font-size:10px;font-weight:700;color:#555;margin-bottom:4px;">Servidor recomendado</div>' +
      '<input id="bvVpnServer" value="' + (v.server || 'Venezuela (o Panamá / Colombia)') + '" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;margin-bottom:9px;font-family:inherit;">' +
      '<div style="font-size:10px;font-weight:700;color:#555;margin-bottom:4px;">Créditos / saldo (nota personal)</div>' +
      '<input id="bvVpnCred" value="' + (v.cred || '') + '" placeholder="Ej: 10 GB / caduca 30-08" style="width:100%;padding:9px;border:1.5px solid #e0d9cc;border-radius:8px;font-size:12px;margin-bottom:12px;font-family:inherit;">' +
      '<button onclick="bvGuardarVpn()" style="width:100%;padding:11px;border-radius:9px;border:none;background:#122542;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;">💾 Guardar en mi dispositivo</button>' +
      '<div style="font-size:9px;color:#aaa;text-align:center;margin-top:8px;">Se guarda solo en este dispositivo. No se envía a ningún servidor.</div>';
  }
  window.bvGuardarVpn = function () {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    saveVpn({ prov: g('bvVpnProv'), user: g('bvVpnUser'), key: g('bvVpnKey'), server: g('bvVpnServer'), cred: g('bvVpnCred') });
    var btn = event && event.target; if (btn) { btn.textContent = '✓ Guardado'; setTimeout(function () { btn.textContent = '💾 Guardar en mi dispositivo'; }, 1600); }
  };
  window.bvVpnVault = loadVpn;


  function montarCentro() {
    if (document.getElementById('bvCentroFab')) return;
    var fab = document.createElement('button');
    fab.id = 'bvCentroFab';
    fab.type = 'button';
    fab.title = 'Trámites de Venezuela — pasaporte, apostilla, consulado, VPN';
    fab.innerHTML = '<span style="font-size:22px;line-height:1;">🇻🇪</span><span style="display:flex;flex-direction:column;line-height:1.15;text-align:left;"><b style="font-size:12px;">Venezuela</b><span style="font-size:8.5px;opacity:.8;">Pasaporte · Apostilla · VPN</span></span>';
    fab.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:9998;display:flex;align-items:center;gap:9px;padding:11px 16px;border-radius:30px;border:2px solid #C9A84C;background:linear-gradient(135deg,#122542,#1c3660);color:#fff;font-family:inherit;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.4);animation:bvPulse 2.2s ease-in-out infinite;';
    // keyframes de pulso (una sola vez)
    if (!document.getElementById('bvPulseStyle')) {
      var st = document.createElement('style'); st.id = 'bvPulseStyle';
      st.textContent = '@keyframes bvPulse{0%,100%{box-shadow:0 6px 22px rgba(0,0,0,.4),0 0 0 0 rgba(201,168,76,.5);}50%{box-shadow:0 6px 22px rgba(0,0,0,.4),0 0 0 10px rgba(201,168,76,0);}}';
      document.head.appendChild(st);
    }

    var panel = document.createElement('div');
    panel.id = 'bvCentroPanel';
    panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(10,15,25,.6);backdrop-filter:blur(3px);align-items:flex-end;justify-content:center;';
    panel.innerHTML =
      '<div style="background:#fff;border-radius:18px 18px 0 0;max-width:480px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 -10px 50px rgba(0,0,0,.4);font-family:\'Segoe UI\',Arial,sans-serif;">' +
        '<div style="position:sticky;top:0;background:linear-gradient(135deg,#122542,#1c3660);padding:15px 18px;display:flex;align-items:center;gap:11px;border-radius:18px 18px 0 0;">' +
          '<span style="font-size:22px;">🇻🇪</span>' +
          '<div style="flex:1;"><div style="font-size:14px;font-weight:800;color:#fff;">Centro Inteligente Venezuela</div><div style="font-size:9.5px;color:#C9A84C;margin-top:1px;">Guías con audio · Pasaporte · Apostilla · Consulados · VPN</div></div>' +
          '<button onclick="bvCerrarCentro()" style="background:none;border:none;color:#8aa;font-size:22px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="bvCentroBody" style="padding:16px 18px 26px;"></div>' +
      '</div>';
    panel.addEventListener('click', function (e) { if (e.target === panel) window.bvCerrarCentro(); });

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    fab.onclick = function () { renderCentro(); panel.style.display = 'flex'; };
  }
  window.bvCerrarCentro = function () {
    var p = document.getElementById('bvCentroPanel'); if (p) p.style.display = 'none';
    if ('speechSynthesis' in window) { speechSynthesis.cancel(); BVAudio._reset(); }
  };

  // ── Respaldo si Firebase no carga (vista previa / sin conexión) ──
  function montarPreviewFallback() {
    var login = document.getElementById('loginScreen');
    var app = document.getElementById('appContent');
    if (!login || !app) return; // esta página no usa este login
    setTimeout(function () {
      // Si Firebase cargó (login funcional) o ya entró, no hacemos nada
      if (typeof window._fbLogin === 'function') return;
      if (getComputedStyle(app).display !== 'none') return;
      if (document.getElementById('bvPreviewBtn')) return;
      var box = login.querySelector('.login-box') || login;
      var aviso = document.createElement('div');
      aviso.style.cssText = 'margin-top:14px;background:#fff8f0;border:1.5px solid #fcd9a5;border-radius:8px;padding:10px 12px;font-size:10px;line-height:1.6;color:#7a5a20;';
      aviso.innerHTML = 'No se pudo conectar con el servidor de acceso (sin internet o vista previa). Puedes ver el sistema en modo local:';
      var btn = document.createElement('button');
      btn.id = 'bvPreviewBtn';
      btn.type = 'button';
      btn.textContent = '👁  Ver el sistema (vista previa)';
      btn.style.cssText = 'width:100%;margin-top:10px;padding:12px;border-radius:9px;border:2px solid #C9A84C;background:#122542;color:#e9d9a8;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
      btn.onclick = function () {
        login.style.display = 'none';
        app.style.display = 'block';
        try {
          if (typeof cargarBoveda === 'function') cargarBoveda();
          if (typeof cargarTabla === 'function') cargarTabla();
          if (typeof actualizarDatosCopia === 'function') actualizarDatosCopia();
          if (typeof loadData === 'function') loadData();
          if (typeof generarPlantillaTrabajo === 'function') generarPlantillaTrabajo();
          if (typeof generarPlantillaBanco === 'function') generarPlantillaBanco();
        } catch (e) {}
        var chip = document.getElementById('userChipName');
        if (chip) chip.textContent = 'Vista previa · Local';
        montarCabecera(); montarCentro();
      };
      box.appendChild(aviso);
      box.appendChild(btn);
    }, 4500);
  }

  // ══ AUDIO ROBUSTO — arregla "el audio no suena" ══════════════════
  function warmVoices() {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); };
    } catch (e) {}
  }
  window.bvSpeak = function (texto) {
    if (!('speechSynthesis' in window) || !texto) return false;
    try {
      speechSynthesis.resume();      // por si el navegador lo dejó en pausa
      speechSynthesis.cancel();      // corta lo anterior
      setTimeout(function () {       // evita el fallo de Chrome (cancel+speak inmediato)
        var u = new SpeechSynthesisUtterance(String(texto).slice(0, 500));
        u.lang = 'es-ES'; u.rate = 0.95; u.pitch = 1;
        var vs = speechSynthesis.getVoices() || [];
        var es = vs.filter(function (v) { return /^es/i.test(v.lang); });
        if (es.length) {
          u.voice = es.find(function (v) { return /female|mujer|m[oó]nica|paulina|helena|laura|luc[ií]a/i.test(v.name); }) || es[0];
        }
        speechSynthesis.speak(u);
      }, 45);
      return true;
    } catch (e) { return false; }
  };
  function patchAudio() {
    warmVoices();
    // El botón "escuchar" (escucharInstruccion) debe sonar SIEMPRE
    var origEsc = window.escucharInstruccion;
    window.escucharInstruccion = function (texto) {
      try { if (window.COPILOTO) window.COPILOTO.vozActiva = true; if (window.DCOP) window.DCOP.vozActiva = true; } catch (e) {}
      window.bvSpeak(texto);
      try {
        if (window.COPILOTO && !window.COPILOTO.abierto && typeof window.toggleCopiloto === 'function') {
          window.toggleCopiloto();
          if (typeof window.agregarMensajeBot === 'function') setTimeout(function () { window.agregarMensajeBot('🎧 ' + String(texto).slice(0, 120) + '…'); }, 250);
        }
      } catch (e) {}
    };
    // Rutas de voz del copiloto → motor robusto
    if (typeof window.hablarCopiloto === 'function') {
      window.hablarCopiloto = function (t) { if (window.COPILOTO && window.COPILOTO.vozActiva === false) return; window.bvSpeak(t); };
    }
    if (typeof window.hablarDoc === 'function') {
      window.hablarDoc = function (t) { if (window.DCOP && window.DCOP.vozActiva === false) return; window.bvSpeak(t); };
    }
  }

  // ── Arranque ─────────────────────────────────────────────────────
  function init() {
    instalarGate();
    montarCabecera();
    montarCentro();
    montarPreviewFallback();
    patchAudio();
    registrarSW();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // reintento por si abrirEnlace se define tarde
  window.addEventListener('load', function () { instalarGate(); montarCabecera(); montarCentro(); patchAudio(); });
})();
