import {
  AdMob,
  AdmobConsentStatus,
  BannerAdSize,
  BannerAdPosition
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
const T={es:{heading:'Escanea un alimento',intro:'Comprueba los ingredientes declarados de un producto.',scan:'Escanear código',again:'Escanear otro',manual:'Introducir código manualmente',history:'Últimos escaneos',disclaimer:'Información orientativa basada en Open Food Facts. Los datos pueden estar incompletos. Revisa siempre el envase.',safe:'APTO',unsafe:'NO APTO',unknown:'NO VERIFICADO',missing:'Producto o ingredientes no disponibles',uncertain:'Hay ingredientes de origen incierto',found:'Ingrediente detectado',clean:'No se han detectado ingredientes de cerdo en la lista disponible',error:'No se pudo consultar el producto',permission:'No se concedió acceso a la cámara'},en:{heading:'Scan a food product',intro:'Check a product’s listed ingredients.',scan:'Scan barcode',again:'Scan another',manual:'Enter barcode manually',history:'Recent scans',disclaimer:'Informational only, based on Open Food Facts. Data may be incomplete. Always check packaging.',safe:'SUITABLE',unsafe:'NOT SUITABLE',unknown:'UNVERIFIED',missing:'Product or ingredients unavailable',uncertain:'Some ingredients have uncertain origins',found:'Detected ingredient',clean:'No pork ingredients detected in available list',error:'Could not look up product',permission:'Camera permission not granted'},fr:{heading:'Scannez un aliment',intro:'Vérifiez les ingrédients déclarés du produit.',scan:'Scanner le code',again:'Scanner un autre',manual:'Saisir un code',history:'Scans récents',disclaimer:'Informations indicatives issues d’Open Food Facts. Les données peuvent être incomplètes. Vérifiez toujours l’emballage.',safe:'ADAPTÉ',unsafe:'NON ADAPTÉ',unknown:'NON VÉRIFIÉ',missing:'Produit ou ingrédients indisponibles',uncertain:'Certains ingrédients ont une origine incertaine',found:'Ingrédient détecté',clean:'Aucun ingrédient porcin détecté dans la liste disponible',error:'Impossible de consulter le produit',permission:'Accès caméra refusé'}};
const $=id=>document.getElementById(id); let lang=localStorage.getItem('lang')||'es', completed=0;
function tr(k){return T[lang][k]} function render(){document.documentElement.lang=lang;for(const [id,key] of Object.entries({heading:'heading',intro:'intro',scan:'scan',again:'again','manual-title':'manual','history-title':'history',disclaimer:'disclaimer'}))$(id).textContent=tr(key);$('lang').value=lang;renderHistory()}
$('lang').onchange=e=>{lang=e.target.value;localStorage.setItem('lang',lang);render()};
const pork=/(\bpork\b|\bpig\b|\bporcine\b|\blard\b|\bbacon\b|\bham\b|\bsaindoux\b|\bporc\b|\bcochon\b|\bcerdo\b|\bporcino\b|\bmanteca de cerdo\b|\bjam[oó]n\b|\btocino\b|\bpancetta\b|\bprosciutto\b|\bschwein\b|\bschweinefleisch\b|\bschmalz\b|\bgelatina de cerdo\b)/i;
const uncertain=/(\bgelatin(e|a)?\b|\bgelatina\b|\bg[eé]latine\b|\brennet\b|\bcuajo\b|\bprésure\b|\banimal fat\b|\bgrasa animal\b|\bgraisse animale\b|\bmono.?diglycerides\b|\bmono.?diglic[eé]ridos\b|\be[- ]?47[1-9]\b|\be[- ]?441\b)/i;
function assess(p){const raw=[p.ingredients_text,p.ingredients_text_es,p.ingredients_text_en,p.ingredients_text_fr].filter(Boolean).join(' | ');if(!raw.trim())return {state:'unknown',detail:tr('missing')};let m=raw.match(pork);if(m)return {state:'unsafe',detail:tr('found')+': '+m[0]};m=raw.match(uncertain);if(m)return {state:'unknown',detail:tr('uncertain')+': '+m[0]};return {state:'safe',detail:tr('clean')}}
function renderHistory(){const items=JSON.parse(localStorage.getItem('history')||'[]');$('history').textContent=items.map(x=>x.name+' · '+x.code).join('\n')||'—';$('history').style.whiteSpace='pre-line'}
async function lookup(code){if(!/^\d{8,14}$/.test(code))return; $('result').style.display='block';$('status').textContent='…';$('product').textContent='';$('detail').textContent='';let state='unknown',detail='',name=code;try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);let res;try{res=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields=code,product_name,product_name_es,product_name_en,product_name_fr,ingredients_text,ingredients_text_es,ingredients_text_en,ingredients_text_fr',{signal:controller.signal})}finally{clearTimeout(timeout)}if(!res.ok)throw Error('HTTP '+res.status);const data=await res.json();if(data.status!==1){detail=tr('missing')}else{name=data.product?.['product_name_'+lang]||data.product?.product_name||code;({state,detail}=assess(data.product||{}))}}catch(e){detail=tr('error')}const labels={safe:tr('safe'),unsafe:tr('unsafe'),unknown:tr('unknown')};$('result').classList.remove('result-safe','result-unsafe','result-unknown');
$('result').classList.add('result-'+state);
$('status').textContent=labels[state];$('status').style.color={safe:'#15803d',unsafe:'#c62828',unknown:'#a36b00'}[state];$('product').textContent=name;$('detail').textContent=detail;let h=JSON.parse(localStorage.getItem('history')||'[]');h.unshift({name,code,state});localStorage.setItem('history',JSON.stringify(h.slice(0,15)));renderHistory();completed++}
$('lookup').onclick=()=>lookup($('barcode').value.trim());$('barcode').onkeydown=e=>{if(e.key==='Enter')lookup(e.target.value.trim())};$('again').onclick=async()=>{await maybeShowInterstitial();$('result').style.display='none'};
$('scan').onclick=async()=>{try{await maybeShowInterstitial();if(!Capacitor.isNativePlatform()){alert('El escáner requiere la aplicación Android. Puedes introducir un código manualmente.');return}const {camera}=await BarcodeScanner.checkPermissions();if(camera!=='granted'){const p=await BarcodeScanner.requestPermissions();if(p.camera!=='granted'){alert(tr('permission'));return}}const moduleStatus = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
if (!moduleStatus.available) {
  await BarcodeScanner.installGoogleBarcodeScannerModule();
  alert('Se está instalando el escáner. Espera unos segundos y vuelve a pulsar Escanear código.');
  return;
}
const r=await BarcodeScanner.scan({formats:[BarcodeFormat.Ean13,BarcodeFormat.Ean8,BarcodeFormat.UpcA,BarcodeFormat.UpcE]});const code=r.barcodes?.[0]?.rawValue;if(code)await lookup(code)}catch(e){alert(String(e.message||e))}};render();


const TEST_ADS = false;
const AD_BANNER = TEST_ADS
  ? 'ca-app-pub-3940256099942544/9214589741'
  : 'ca-app-pub-8854680295966508/9086592417';
const AD_INTERSTITIAL = TEST_ADS
  ? 'ca-app-pub-3940256099942544/1033173712'
  : 'ca-app-pub-8854680295966508/6735761245';

let adsReady = false;
let interstitialReady = false;
let lastInterstitialScan = 0;

async function prepareInterstitial() {
  if (!adsReady) return;
  try {
    await AdMob.prepareInterstitial({adId: AD_INTERSTITIAL});
    interstitialReady = true;
  } catch(e) {
    interstitialReady = false;
    console.warn(e);
  }
}

async function maybeShowInterstitial() {
  if (completed - lastInterstitialScan < 5) return;
  if (!adsReady || !interstitialReady) return;
  lastInterstitialScan = completed;

  interstitialReady = false;
  try {
    await AdMob.showInterstitial();
  } catch(e) {
    console.warn(e);
  }
  await prepareInterstitial();
}

async function startAds() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    let consent = await AdMob.requestConsentInfo();

    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    ) {
      consent = await AdMob.showConsentForm();
    }

    if (
      consent.privacyOptionsRequirementStatus === 'REQUIRED'
    ) {
      document.getElementById('privacy-options').style.display = 'block';
    }

    if (!consent.canRequestAds) return;

    await AdMob.initialize();
    adsReady = true;

    await AdMob.showBanner({
      adId: AD_BANNER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0
    });

    await prepareInterstitial();
  } catch(e) {
    console.warn('AdMob:', e);
  }
}

document.getElementById('privacy-options').onclick = async () => {
  try {
    await AdMob.showPrivacyOptionsForm();
  } catch(e) {
    console.warn(e);
  }
};

setTimeout(startAds, 500);
