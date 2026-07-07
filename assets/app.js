/* ==========================================================================
   DATA
   ========================================================================== */
var STOPS = [
  { id:'palmi',     name:'1. Palmi & Tropea',        lat:38.3589, lng:15.8517,  mode:'start', target:'#base-calabria',  fam:true  },
  { id:'maratea',   name:'2. Maratea (lunch stop)',  lat:39.9944,lng:15.7202,mode:'drive', target:'#base-amalfi',    fam:false },
  { id:'atrani',    name:'3. Amalfi Coast, Atrani',  lat:40.6333,lng:14.6167,mode:'ferry', target:'#base-amalfi',    fam:false },
  { id:'ravello',   name:'4. Ravello (day trip)',    lat:40.6492,lng:14.6114,mode:'drive', target:'#base-amalfi',    fam:false },
  { id:'rome',      name:'5. Rome',                  lat:41.9028,lng:12.4964,mode:'train', target:'#base-rome',      fam:false },
  { id:'orvieto',   name:'6. Orvieto (lunch stop)',  lat:42.7186,lng:12.1122,mode:'train', target:'#base-valdorcia', fam:false },
  { id:'valdorcia', name:'7. Val d\'Orcia',          lat:43.0778,lng:11.6778,mode:'train', target:'#base-valdorcia', fam:false },
  { id:'siena',     name:'8. Siena (stop)',          lat:43.3188,lng:11.3308,mode:'drive', target:'#base-florence',  fam:false },
  { id:'florence',  name:'9. Florence',              lat:43.7696,lng:11.2558,mode:'drive', target:'#base-florence',  fam:false },
  { id:'lucca',     name:'10. Lucca',                lat:43.8429,lng:10.5027,mode:'train', target:'#base-lucca',     fam:true  },
  { id:'pisa',      name:'11. Pisa (bonus)',         lat:43.7228,lng:10.4017,mode:'train', target:'#base-lucca',     fam:false }
];
var ROUTE_COLORS = { drive:'#2E4034', ferry:'#6E7B82', train:'#B08A3E' };
var ROUTE_DASH   = { drive:null, ferry:'8 8', train:'2 8' };
var routeMarkers = {};

/* ==========================================================================
   HELPERS
   ========================================================================== */
function prefersReducedMotion(){
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function scrollToSection(target){
  var el = document.querySelector(target);
  if(!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block:'start' });
  el.classList.add('flash-highlight');
  window.setTimeout(function(){ el.classList.remove('flash-highlight'); }, 1200);
}

/* ==========================================================================
   SEASON TOGGLE (April / May)
   ========================================================================== */
function initSeasonToggle(){
  var btnA = document.getElementById('btnA');
  var btnB = document.getElementById('btnB');
  if(!btnA || !btnB) return;
  function setSeason(s){
    document.documentElement.setAttribute('data-season', s);
    btnA.setAttribute('aria-pressed', s === 'a' ? 'true' : 'false');
    btnB.setAttribute('aria-pressed', s === 'b' ? 'true' : 'false');
  }
  btnA.addEventListener('click', function(){ setSeason('a'); });
  btnB.addEventListener('click', function(){ setSeason('b'); });
}

/* ==========================================================================
   MOBILE HAMBURGER NAV
   ========================================================================== */
function initHamburger(){
  var btn = document.getElementById('hamburger');
  var nav = document.getElementById('mobile-nav');
  if(!btn || !nav) return;
  btn.addEventListener('click', function(){
    var open = document.body.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   SCROLL PROGRESS BAR
   ========================================================================== */
function initScrollProgress(){
  var bar = document.getElementById('scroll-progress');
  if(!bar) return;
  var ticking = false;
  function update(){
    var h = document.documentElement;
    var scrollTop = h.scrollTop || document.body.scrollTop;
    var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = pct + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, { passive:true });
  update();
}

/* ==========================================================================
   ACTIVE NAV HIGHLIGHTING + SIDEBAR "NOW VIEWING"
   ========================================================================== */
function initStickyNavAndActive(){
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
  var sbCurrent = document.getElementById('sb-current');
  if(!sections.length) return;
  var titles = {};
  sections.forEach(function(s){
    var h = s.querySelector('h2');
    titles[s.id] = h ? h.textContent.trim() : s.id;
  });
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var id = entry.target.id;
        navLinks.forEach(function(a){
          var isCurrent = a.getAttribute('href') === '#' + id;
          a.toggleAttribute('aria-current', isCurrent);
          if(isCurrent) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current');
        });
        if(sbCurrent) sbCurrent.textContent = titles[id];
      }
    });
  }, { rootMargin:'-40% 0px -50% 0px', threshold:0 });
  sections.forEach(function(s){ observer.observe(s); });
}

/* ==========================================================================
   INTERSECTION-OBSERVER REVEAL ANIMATIONS
   ========================================================================== */
function initReveals(){
  var items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(prefersReducedMotion()){
    items.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  items.forEach(function(el){ observer.observe(el); });
}

/* ==========================================================================
   ANIMATED STAT COUNTERS
   ========================================================================== */
function animateCount(el, target, duration){
  var start = 0;
  var startTime = null;
  function step(ts){
    if(startTime === null) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if(progress < 1) window.requestAnimationFrame(step);
    else el.textContent = target;
  }
  window.requestAnimationFrame(step);
}
function initCounters(){
  var nums = document.querySelectorAll('.stat-num[data-count]');
  if(!nums.length) return;
  if(prefersReducedMotion()){
    nums.forEach(function(el){ el.textContent = el.getAttribute('data-count'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var target = parseInt(entry.target.getAttribute('data-count'), 10) || 0;
        animateCount(entry.target, target, 1300);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold:0.5 });
  nums.forEach(function(el){ observer.observe(el); });
}

/* ==========================================================================
   ROUTE MAP (Leaflet, with SVG fallback + accessible stop list)
   ========================================================================== */
function buildRouteList(){
  var list = document.getElementById('route-list');
  if(!list) return;
  STOPS.forEach(function(stop){
    var li = document.createElement('li');
    li.setAttribute('data-stop', stop.id);
    var btn = document.createElement('button');
    btn.type = 'button';
    var num = document.createElement('span');
    num.className = 'rn';
    num.textContent = stop.name.split('.')[0];
    var txt = document.createElement('span');
    txt.className = 'rt';
    txt.textContent = stop.name.replace(/^\d+\.\s*/, '');
    btn.appendChild(num);
    btn.appendChild(txt);
    btn.addEventListener('click', function(){ scrollToSection(stop.target); });
    btn.addEventListener('mouseenter', function(){ highlightStop(stop.id, true); });
    btn.addEventListener('mouseleave', function(){ highlightStop(stop.id, false); });
    btn.addEventListener('focus', function(){ highlightStop(stop.id, true); });
    btn.addEventListener('blur', function(){ highlightStop(stop.id, false); });
    li.appendChild(btn);
    list.appendChild(li);
  });
}
function highlightStop(id, on){
  var li = document.querySelector('.route-list [data-stop="' + id + '"]');
  if(li) li.classList.toggle('is-active', on);
  var marker = routeMarkers[id];
  if(marker && marker._icon){ marker._icon.style.transform += ''; marker._icon.style.zIndex = on ? 1000 : ''; }
}
function showMapFallback(){
  var mapEl = document.getElementById('route-map');
  var fallback = document.getElementById('map-fallback');
  if(mapEl) mapEl.style.display = 'none';
  if(fallback) fallback.hidden = false;
}
function initMap(){
  buildRouteList();
  var mapEl = document.getElementById('route-map');
  if(!mapEl) return;
  if(typeof L === 'undefined'){ showMapFallback(); return; }
  try{
    var map = L.map('route-map', { scrollWheelZoom:false }).setView([41.8, 13.2], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom:18
    }).addTo(map);

    STOPS.forEach(function(stop, i){
      var icon = L.divIcon({
        className:'route-pin' + (stop.fam ? ' fam' : ''),
        html:'<span>' + (i+1) + '</span>',
        iconSize:[30,30]
      });
      var marker = L.marker([stop.lat, stop.lng], { icon:icon, title:stop.name }).addTo(map);
      marker.bindTooltip(stop.name.replace(/^\d+\.\s*/, ''), { direction:'top', offset:[0,-16] });
      marker.on('click', function(){ scrollToSection(stop.target); });
      marker.on('mouseover', function(){ highlightStop(stop.id, true); });
      marker.on('mouseout', function(){ highlightStop(stop.id, false); });
      routeMarkers[stop.id] = marker;
    });

    for(var i=1;i<STOPS.length;i++){
      var a = STOPS[i-1], b = STOPS[i];
      var color = ROUTE_COLORS[b.mode] || ROUTE_COLORS.drive;
      var dash = ROUTE_DASH[b.mode] || null;
      L.polyline([[a.lat,a.lng],[b.lat,b.lng]], { color:color, weight:3, opacity:.85, dashArray:dash }).addTo(map);
    }
  } catch(e){
    showMapFallback();
  }
}

/* ==========================================================================
   LIGHTBOX GALLERY
   ========================================================================== */
function initLightbox(){
  var lightbox = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  var closeBtn = document.getElementById('lightbox-close');
  if(!lightbox || !img) return;
  var lastFocused = null;

  function open(src, alt, cap){
    lastFocused = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    caption.textContent = cap || '';
    lightbox.hidden = false;
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }
  function close(){
    lightbox.hidden = true;
    img.src = '';
    document.removeEventListener('keydown', onKeydown);
    if(lastFocused) lastFocused.focus();
  }
  function onKeydown(e){
    if(e.key === 'Escape') close();
  }
  document.querySelectorAll('figure[data-lightbox] img, .exp-media img, .hotel-media img, .rest-media img').forEach(function(im){
    im.style.cursor = 'zoom-in';
    im.addEventListener('click', function(){
      var fig = im.closest('figure');
      var cap = (fig && fig.getAttribute('data-caption')) || im.alt;
      open(im.currentSrc || im.src, im.alt, cap);
    });
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox) close(); });
}

/* ==========================================================================
   BACK TO TOP
   ========================================================================== */
function initBackToTop(){
  var btn = document.getElementById('back-to-top');
  if(!btn) return;
  window.addEventListener('scroll', function(){
    btn.classList.toggle('show', window.scrollY > 700);
  }, { passive:true });
  btn.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/* ==========================================================================
   HERO PARALLAX (rAF throttled, disabled under reduced motion)
   ========================================================================== */
function initParallax(){
  var bg = document.getElementById('hero-bg');
  if(!bg || prefersReducedMotion()) return;
  var ticking = false;
  function update(){
    var offset = window.scrollY * 0.35;
    bg.style.transform = 'translateY(' + offset + 'px)';
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }, { passive:true });
}


/* ==========================================================================
   PER-BASE CAROUSELS
   ========================================================================== */
function initCarousels(){
  document.querySelectorAll('.carousel').forEach(function(car){
    var track = car.querySelector('.carousel-track');
    var prev = car.querySelector('.carousel-btn.prev');
    var next = car.querySelector('.carousel-btn.next');
    if(!track) return;
    function step(){
      var card = track.querySelector('*');
      return card ? card.getBoundingClientRect().width + 22 : track.clientWidth * 0.8;
    }
    function update(){
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      if(prev) prev.hidden = track.scrollLeft <= 2;
      if(next) next.hidden = track.scrollLeft >= maxScroll;
    }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-step(), behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left:step(), behavior:'smooth'}); });
    track.addEventListener('scroll', function(){ window.requestAnimationFrame(update); }, {passive:true});
    window.addEventListener('resize', update);
    update();
  });
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function(){
  initSeasonToggle();
  initHamburger();
  initScrollProgress();
  initStickyNavAndActive();
  initReveals();
  initCounters();
  initMap();
  initLightbox();
  initBackToTop();
  initParallax();
  initCarousels();
});
