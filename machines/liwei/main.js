(function() {

  var CELL=24;
  var availW=window.innerWidth-36;
  var bodyStyle=getComputedStyle(document.body);
  var bodyPadV=parseFloat(bodyStyle.paddingTop)+parseFloat(bodyStyle.paddingBottom);
  var bodyGapV=(parseFloat(bodyStyle.rowGap)||parseFloat(bodyStyle.gap)||0)*3;
  var hdrMargin=parseFloat(getComputedStyle(document.querySelector("header")||{}).marginBottom)||0;
  var hudMargin=parseFloat(getComputedStyle(document.getElementById("hud")||{}).marginBottom)||0;
  var availH=window.innerHeight
    - (document.querySelector("header")||{offsetHeight:50}).offsetHeight
    - (document.getElementById("hud")||{offsetHeight:40}).offsetHeight
    - (document.querySelector(".controls-hint")||{offsetHeight:20}).offsetHeight
    - (bodyPadV+bodyGapV+hdrMargin+hudMargin);
  var COLS=Math.max(10, Math.min(24, Math.floor(availW/CELL)));
  var ROWS=Math.max(14, Math.min(28, Math.floor(availH/CELL)));
  var SIZE_W=COLS*CELL, SIZE_H=ROWS*CELL;
  var isMobileDevice=("ontouchstart" in window)||(navigator.maxTouchPoints>0);
  if(!isMobileDevice){ SIZE_W=Math.min(SIZE_W,576); SIZE_H=Math.min(SIZE_H,672); }
  var osubEl=document.getElementById("osub");
  // if(osubEl){ osubEl.textContent=isMobileDevice?"Swipe to move. Gobble every kueh.":"Arrow keys or WASD to move. Gobble every kueh."; }
  if(osubEl){ osubEl.textContent=isMobileDevice?"Hungry? Gobble every kueh.":"Hungry? Gobble every kueh."; }
  COLS=Math.floor(SIZE_W/CELL); ROWS=Math.floor(SIZE_H/CELL);
  SIZE_W=COLS*CELL; SIZE_H=ROWS*CELL;
  var NORMAL_SPEED=135, BOOST_SPEED=95;
  var COFFEE_DURATION=8000, BOOST_DURATION=8000;
  var canvas=document.getElementById("game");
  var dpr=window.devicePixelRatio||1;
  canvas.width=SIZE_W*dpr; canvas.height=SIZE_H*dpr;
  canvas.style.width=SIZE_W+"px"; canvas.style.height=SIZE_H+"px";
  var ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  document.getElementById("hud").style.width=SIZE_W+"px";
  var elScore=document.getElementById("score");
  var elStreak=document.getElementById("streak");

  function makeImg(b64) {
    var img=new Image();
    img._ready=false;
    img.onload=function(){ img._ready=true; };
    img.src="data:image/svg+xml;base64,"+b64;
    return img;
  }
  var coffeeImg = null; // drawn directly now
  var imgs = {
    // ondeh: makeImg("PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNUE4QTRBIi8+CiAgPCEtLSBkYXJrZXIgZWRnZSByaW5nIC0tPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjkiIGZpbGw9IiM0QTdBM0EiLz4KICA8IS0tIG1haW4gZ3JlZW4gYm9keSAtLT4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBmaWxsPSIjNUE4QTRBIi8+CiAgPCEtLSBjb2NvbnV0IGZsZWNrcyB0b3AgdmlldyAtLT4KICA8ZyBmaWxsPSIjRjVFNkM4IiBvcGFjaXR5PSIwLjkiPgogICAgPHJlY3QgeD0iNiIgeT0iMyIgd2lkdGg9IjIiIGhlaWdodD0iMSIgcng9IjAuNSIgdHJhbnNmb3JtPSJyb3RhdGUoLTIwIDcgMy41KSIvPgogICAgPHJlY3QgeD0iMTIiIHk9IjMiIHdpZHRoPSIyIiBoZWlnaHQ9IjEiIHJ4PSIwLjUiIHRyYW5zZm9ybT0icm90YXRlKDIwIDEzIDMuNSkiLz4KICAgIDxyZWN0IHg9IjMiIHk9IjgiIHdpZHRoPSIyIiBoZWlnaHQ9IjEiIHJ4PSIwLjUiIHRyYW5zZm9ybT0icm90YXRlKC03MCA0IDguNSkiLz4KICAgIDxyZWN0IHg9IjE1IiB5PSI4IiB3aWR0aD0iMiIgaGVpZ2h0PSIxIiByeD0iMC41IiB0cmFuc2Zvcm09InJvdGF0ZSg3MCAxNiA4LjUpIi8+CiAgICA8cmVjdCB4PSIzIiB5PSIxMiIgd2lkdGg9IjIiIGhlaWdodD0iMSIgcng9IjAuNSIgdHJhbnNmb3JtPSJyb3RhdGUoNzAgNCAxMi41KSIvPgogICAgPHJlY3QgeD0iMTUiIHk9IjEyIiB3aWR0aD0iMiIgaGVpZ2h0PSIxIiByeD0iMC41IiB0cmFuc2Zvcm09InJvdGF0ZSgtNzAgMTYgMTIuNSkiLz4KICAgIDxyZWN0IHg9IjYiIHk9IjE2IiB3aWR0aD0iMiIgaGVpZ2h0PSIxIiByeD0iMC41IiB0cmFuc2Zvcm09InJvdGF0ZSgyMCA3IDE2LjUpIi8+CiAgICA8cmVjdCB4PSIxMiIgeT0iMTYiIHdpZHRoPSIyIiBoZWlnaHQ9IjEiIHJ4PSIwLjUiIHRyYW5zZm9ybT0icm90YXRlKC0yMCAxMyAxNi41KSIvPgogIDwvZz4KICA8IS0tIHBhbG0gc3VnYXIgY2VudHJlIC0tPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjMiIGZpbGw9IiNCODYwMUEiLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIyIiBmaWxsPSIjQzg3MjFBIi8+Cjwvc3ZnPg=="),
    // angku: makeImg("PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBncmVlbiBsZWFmIHNob3dpbmcgYXQgZWRnZXMgLS0+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNEE3QTNBIi8+CiAgPCEtLSByZWQgYm9keSBvdmFsIHRvcCB2aWV3IC0tPgogIDxlbGxpcHNlIGN4PSIxMCIgY3k9IjEwIiByeD0iOSIgcnk9IjgiIGZpbGw9IiNDODUwM0EiLz4KICA8ZWxsaXBzZSBjeD0iMTAiIGN5PSIxMCIgcng9IjgiIHJ5PSI3IiBmaWxsPSIjRDg2MDRBIi8+CiAgPCEtLSBzdGFtcCBwYXR0ZXJuIHRvcCB2aWV3IC0tPgogIDxyZWN0IHg9IjYiIHk9IjYiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHJ4PSIxIiBmaWxsPSJub25lIiBzdHJva2U9IiNBMDMwMjAiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPGxpbmUgeDE9IjEwIiB5MT0iNiIgeDI9IjEwIiB5Mj0iMTQiIHN0cm9rZT0iI0EwMzAyMCIgc3Ryb2tlLXdpZHRoPSIwLjYiLz4KICA8bGluZSB4MT0iNiIgeTE9IjEwIiB4Mj0iMTQiIHkyPSIxMCIgc3Ryb2tlPSIjQTAzMDIwIiBzdHJva2Utd2lkdGg9IjAuNiIvPgogIDwhLS0gaGlnaGxpZ2h0IHRvcCBsZWZ0IC0tPgogIDxlbGxpcHNlIGN4PSI3IiBjeT0iNyIgcng9IjIuNSIgcnk9IjEuNSIgZmlsbD0iI0U4NzA2MCIgb3BhY2l0eT0iMC40Ii8+Cjwvc3ZnPg=="),
    // lapis: makeImg("PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNUE4QTRBIi8+CiAgPHJlY3QgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjMiIGZpbGw9IiNGNUU2QzgiLz4KICA8cmVjdCB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iMyIgZmlsbD0iI0Q0Nzg4QSIvPgogIDxyZWN0IHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMyIgZmlsbD0iI0Y1RTZDOCIvPgogIDxyZWN0IHk9IjEzIiB3aWR0aD0iMjAiIGhlaWdodD0iMyIgZmlsbD0iIzVBOEE0QSIvPgogIDxyZWN0IHk9IjE2IiB3aWR0aD0iMjAiIGhlaWdodD0iMiIgZmlsbD0iI0Y1RTZDOCIvPgogIDxyZWN0IHk9IjE4IiB3aWR0aD0iMjAiIGhlaWdodD0iMiIgZmlsbD0iI0Q0Nzg4QSIvPgogIDxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4xIi8+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjE1Ii8+Cjwvc3ZnPg=="),
    // bahulu: makeImg("PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRjVFNkM4Ii8+CiAgPCEtLSA2IHBldGFscyB0b3AgdmlldyAtLT4KICA8ZWxsaXBzZSBjeD0iMTAiIGN5PSI0IiByeD0iMyIgcnk9IjQiIGZpbGw9IiNDNDkzM0YiLz4KICA8ZWxsaXBzZSBjeD0iMTAiIGN5PSIxNiIgcng9IjMiIHJ5PSI0IiBmaWxsPSIjQzQ5MzNGIi8+CiAgPGVsbGlwc2UgY3g9IjQiIGN5PSIxMCIgcng9IjQiIHJ5PSIzIiBmaWxsPSIjQzQ5MzNGIi8+CiAgPGVsbGlwc2UgY3g9IjE2IiBjeT0iMTAiIHJ4PSI0IiByeT0iMyIgZmlsbD0iI0M0OTMzRiIvPgogIDxlbGxpcHNlIGN4PSI1LjUiIGN5PSI1LjUiIHJ4PSIzIiByeT0iMyIgZmlsbD0iI0M0OTMzRiIvPgogIDxlbGxpcHNlIGN4PSIxNC41IiBjeT0iNS41IiByeD0iMyIgcnk9IjMiIGZpbGw9IiNDNDkzM0YiLz4KICA8ZWxsaXBzZSBjeD0iNS41IiBjeT0iMTQuNSIgcng9IjMiIHJ5PSIzIiBmaWxsPSIjQzQ5MzNGIi8+CiAgPGVsbGlwc2UgY3g9IjE0LjUiIGN5PSIxNC41IiByeD0iMyIgcnk9IjMiIGZpbGw9IiNDNDkzM0YiLz4KICA8IS0tIGNlbnRyZSAtLT4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI0LjUiIGZpbGw9IiNENEE4NDAiLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSIjQzQ5MzNGIi8+CiAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMS41IiBmaWxsPSIjQjA3ODE4Ii8+Cjwvc3ZnPg=="),
    // putu: makeImg("PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBiYWNrZ3JvdW5kIHNsaWdodGx5IGRhcmtlciBzbyBpdCBkb2Vzbid0IGJsZW5kIC0tPgogIDxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0U4RDhCMCIvPgogIDwhLS0gbm9vZGxlIG5lc3QgY29uY2VudHJpYyByaW5ncyAtLT4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI5IiBmaWxsPSIjRjVFNkM4Ii8+CiAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRDMDkwIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QzA5MCIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI1IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEMwOTAiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRDMDkwIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDwhLS0gY29jb251dCBiaXRzIC0tPgogIDxnIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiPgogICAgPHJlY3QgeD0iNCIgeT0iNSIgd2lkdGg9IjIuNSIgaGVpZ2h0PSIxIiByeD0iMC41Ii8+CiAgICA8cmVjdCB4PSIxMyIgeT0iNSIgd2lkdGg9IjIuNSIgaGVpZ2h0PSIxIiByeD0iMC41Ii8+CiAgICA8cmVjdCB4PSI0IiB5PSIxNCIgd2lkdGg9IjIuNSIgaGVpZ2h0PSIxIiByeD0iMC41Ii8+CiAgICA8cmVjdCB4PSIxMyIgeT0iMTQiIHdpZHRoPSIyLjUiIGhlaWdodD0iMSIgcng9IjAuNSIvPgogIDwvZz4KICA8IS0tIHBhbG0gc3VnYXIgY2VudHJlIC0tPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjIuNSIgZmlsbD0iI0M0OTMzRiIvPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0iI0IwNzgxOCIvPgo8L3N2Zz4="),
    ondeh: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMzMEE4NzUiPjwvcmVjdD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzVCREY2OSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE0LjQ3NDkiIGN5PSIxNC40NzQ5IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iOS41MjUxNSIgY3k9IjE0LjQ3NDkiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSI5LjUyNTE1IiBjeT0iOC43NSIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE0LjQ3NDkiIGN5PSI4Ljc1IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTkuNzUiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE3Ljc1IiBjeT0iMTAuNzUiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSIxNi45NDk4IiBjeT0iMTYuOTQ5NyIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTkiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSI3LjA1MDIzIiBjeT0iMTYuOTQ5NyIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjMuNzUiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjYuNzUiIGN5PSIxMC43NSIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjcuMDUwMjMiIGN5PSI3LjA1MDI2IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSI1IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTYuOTQ5OCIgY3k9IjcuMDUwMjYiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KPC9zdmc+Cg=="),
    angku: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMzMEE4NzUiPjwvcmVjdD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI0ZFNUU1QSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNy4yNSIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSI+PC9jaXJjbGU+CiAgPHBhdGggZD0iTTEyIDhWMTAiIHN0cm9rZT0iI0VGNEI0OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xNiAxMkgxMyIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+CiAgPHBhdGggZD0iTTExIDEySDgiIHN0cm9rZT0iI0VGNEI0OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xMiAxNFYxNiIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+Cjwvc3ZnPgo="),
    // angku: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMzMEE4NzUiPjwvcmVjdD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI0ZFNUU1QSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNy4yNSIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSI+PC9jaXJjbGU+CiAgPHBhdGggZD0iTTEyIDhWMTAiIHN0cm9rZT0iI0VGNEI0OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xNiAxMkgxMyIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+CiAgPHBhdGggZD0iTTExIDEySDgiIHN0cm9rZT0iI0VGNEI0OSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xMiAxNFYxNiIgc3Ryb2tlPSIjRUY0QjQ5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+Cjwvc3ZnPgo="),
    // lapis: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMzMEE4NzUiPjwvcmVjdD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzVCREY2OSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE0LjQ3NDkiIGN5PSIxNC40NzQ5IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iOS41MjUxNSIgY3k9IjE0LjQ3NDkiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSI5LjUyNTE1IiBjeT0iOC43NSIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE0LjQ3NDkiIGN5PSI4Ljc1IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTkuNzUiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjE3Ljc1IiBjeT0iMTAuNzUiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSIxNi45NDk4IiBjeT0iMTYuOTQ5NyIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTkiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KICA8Y2lyY2xlIGN4PSI3LjA1MDIzIiBjeT0iMTYuOTQ5NyIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjMuNzUiIGN5PSIxMiIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjYuNzUiIGN5PSIxMC43NSIgcj0iMC43NSIgZmlsbD0id2hpdGUiPjwvY2lyY2xlPgogIDxjaXJjbGUgY3g9IjcuMDUwMjMiIGN5PSI3LjA1MDI2IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSI1IiByPSIwLjc1IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CiAgPGNpcmNsZSBjeD0iMTYuOTQ5OCIgY3k9IjcuMDUwMjYiIHI9IjAuNzUiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KPC9zdmc+Cg=="),
    bahulu: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNGRkRFQjQiPjwvcmVjdD4KICA8cGF0aCBkPSJNOC40NTYzNiAyLjc3OTkyQzguODk5OTggMS45MjE0MiA5LjcxOTg4IDEuMjc2NTIgMTAuNjMyOCAwLjk4NTY2NUMxMS42MzQ5IDAuNjYxMDc5IDEyLjcyNDggMC43NTQ1NiAxMy42NTc0IDEuMjQ1MDdDMTQuMjE4NyAxLjUzOTIyIDE0Ljk5NjEgMi4yMDU5OSAxNS4yMzQ0IDIuNzk2MUMxNS40MjAzIDMuMTIyNjcgMTUuNTk2NiAzLjAxODYyIDE1LjkwNjcgMi45MTkwNUMxNy4wMDgyIDIuNzExMiAxNy45ODA5IDIuODE5NDUgMTguOTI4IDMuNDcxOTZDMTkuNzcyOSA0LjA2MDM4IDIwLjM0OTYgNC45NjE2OSAyMC41MzE4IDUuOTc3M0MyMC42MTgxIDYuNDQ2NjIgMjAuNjA0MyA2LjkzMzY0IDIwLjUxMzkgNy40MDI5OEMyMC41MDI0IDcuNDYyMDIgMjAuNDYyMSA3LjY0ODI0IDIwLjQyODYgNy42OTI2N0MyMC40MDA3IDcuOTU1MjMgMjAuNTc2NiA4LjEzMzc4IDIwLjc5NjQgOC4yMzUyNkMyMy41MDkxIDkuNzkzNyAyMy40NDQ3IDEzLjc4NDEgMjAuNzcwOCAxNS4zNjkyQzIwLjU1MDIgMTUuNDgyMyAyMC4zNzMyIDE1LjY5OTcgMjAuNDU1NSAxNS45NTg5QzIwLjcyNTggMTYuOTgwNiAyMC42MjM3IDE3Ljk3ODYgMjAuMDkxMiAxOC44OTlDMTkuNTg2OSAxOS43NzcxIDE4Ljc1MTUgMjAuNDE0NCAxNy43NzM2IDIwLjY2NzNDMTcuMTA4MiAyMC44NDA1IDE2LjYyNzIgMjAuODEzOCAxNS45NjE3IDIwLjY5NjZDMTUuODQzNyAyMC42NjMyIDE1LjcyMTcgMjAuNjMwMyAxNS42MDQ3IDIwLjU5NDZDMTUuNDQxNCAyMC42NTI2IDE1LjM1OTggMjAuNjcyOCAxNS4yMzEyIDIwLjc5NDRDMTQuOTA3IDIxLjQ4ODcgMTQuMjExIDIyLjA4NTkgMTMuNTI5OSAyMi40MTExQzEyLjU1NjQgMjIuODY4IDExLjQ0MjQgMjIuOTE5NiAxMC40MzEzIDIyLjU1NDdDOS41OTA1MyAyMi4yNTI2IDguNzY5NDYgMjEuNjA0MiA4LjM3OTYyIDIwLjc4NTdDOC4yNzYxNSAyMC42Njk0IDguMTc0IDIwLjY0MTYgOC4wMzA3NSAyMC41ODU5TDcuNjQzNzUgMjAuNjk3QzcuMDA1NjYgMjAuODE2NSA2LjQzNTI0IDIwLjgyOTcgNS44MDIxNiAyMC42NjExQzQuODI2NzUgMjAuMzk0NyAzLjk5NjI2IDE5Ljc1MTIgMy40OTI1IDE4Ljg3MThDMi45NjIzIDE3LjkzODkgMi44NzYxNSAxNi45NTA4IDMuMTU2MzYgMTUuOTI0OEMzLjIzMjE5IDE1LjY2NzcgMy4wNzMyMyAxNS40OTAyIDIuODYxMzQgMTUuMzY4MUMyLjExODczIDE0LjkyOTcgMS42NjAzOCAxNC41MDMyIDEuMjU5NDYgMTMuNzEzNEMwLjc0OTU3NiAxMi42ODc3IDAuNjYzODMyIDExLjUwMTUgMS4wMjA4OCAxMC40MTI2QzEuMzM5MDcgOS40MzUwNyAxLjk0ODc3IDguNjg1MzggMi44NjM1NiA4LjIyMjFDMy4wNjcxNSA4LjEzMzQ0IDMuMjU5ODggNy45MjgxMiAzLjIwMzc1IDcuNjkwODdDMy4xODA1NCA3LjY1NTU4IDMuMTUwNjUgNy41MjkyIDMuMTQwODcgNy40ODQyNUMzLjAyNjU2IDYuOTU4NjcgMy4wMTUzMyA2LjQxOTY2IDMuMTI1NDMgNS44OTI0OEMzLjMzMDcxIDQuODc5OTEgMy45Mjg1OCAzLjk5MDcxIDQuNzg3MzggMy40MjA3MUM1LjczODQ1IDIuNzk4MjYgNi43MTk2NyAyLjcwNDg1IDcuODA1MzMgMi45MzYzOUM3LjkyMDMxIDIuOTcwNjIgOC4wMzYyNyAzLjAwMTQgOC4xNTMwNyAzLjAyODdDOC4zNDcxMSAyLjk1ODg1IDguMzU0MTMgMi45NTcxMSA4LjQ1NjM2IDIuNzc5OTJaIiBmaWxsPSIjRkRCNzVGIj48L3BhdGg+CiAgPHBhdGggZD0iTTkgMTguODY2NkwxMC4wNzcyIDE2LjA2NjciIHN0cm9rZT0iI0Y4OUMzRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xNC43MTgxIDE4Ljg2NjZMMTMuNjQwOSAxNi4wNjY3IiBzdHJva2U9IiNGODlDM0YiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8cGF0aCBkPSJNOSA1TDEwLjA3NzIgNy43OTk5MiIgc3Ryb2tlPSIjRjg5QzNGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+CiAgPHBhdGggZD0iTTE0LjcxODEgNUwxMy42NDA5IDcuNzk5OTIiIHN0cm9rZT0iI0Y4OUMzRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik00LjYzNjE3IDE1LjI5NzJMNy4zMTYwNCAxMy45NDg4IiBzdHJva2U9IiNGODlDM0YiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8cGF0aCBkPSJNMTguNzg2NiAxNS4yOTcyTDE2LjEwNjcgMTMuOTQ4OCIgc3Ryb2tlPSIjRjg5QzNGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L3BhdGg+CiAgPHBhdGggZD0iTTQuNjM2MTcgOUw3LjMxNjA0IDEwLjM0ODQiIHN0cm9rZT0iI0Y4OUMzRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0xOC43ODY2IDlMMTYuMTA2NyAxMC4zNDg0IiBzdHJva2U9IiNGODlDM0YiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIyIiBmaWxsPSIjRjg5QzNGIj48L2NpcmNsZT4KPC9zdmc+Cg=="),
    putu: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNGRkRFQjQiPjwvcmVjdD4KICA8cGF0aCBkPSJNOC40NTYzNiAyLjc3OTkyQzguODk5OTggMS45MjE0MiA5LjcxOTg4IDEuMjc2NTIgMTAuNjMyOCAwLjk4NTY2NUMxMS42MzQ5IDAuNjYxMDc5IDEyLjcyNDggMC43NTQ1NiAxMy42NTc0IDEuMjQ1MDdDMTQuMjE4NyAxLjUzOTIyIDE0Ljk5NjEgMi4yMDU5OSAxNS4yMzQ0IDIuNzk2MUMxNS40MjAzIDMuMTIyNjcgMTUuNTk2NiAzLjAxODYyIDE1LjkwNjcgMi45MTkwNUMxNy4wMDgyIDIuNzExMiAxNy45ODA5IDIuODE5NDUgMTguOTI4IDMuNDcxOTZDMTkuNzcyOSA0LjA2MDM4IDIwLjM0OTYgNC45NjE2OSAyMC41MzE4IDUuOTc3M0MyMC42MTgxIDYuNDQ2NjIgMjAuNjA0MyA2LjkzMzY0IDIwLjUxMzkgNy40MDI5OEMyMC41MDI0IDcuNDYyMDIgMjAuNDYyMSA3LjY0ODI0IDIwLjQyODYgNy42OTI2N0MyMC40MDA3IDcuOTU1MjMgMjAuNTc2NiA4LjEzMzc4IDIwLjc5NjQgOC4yMzUyNkMyMy41MDkxIDkuNzkzNyAyMy40NDQ3IDEzLjc4NDEgMjAuNzcwOCAxNS4zNjkyQzIwLjU1MDIgMTUuNDgyMyAyMC4zNzMyIDE1LjY5OTcgMjAuNDU1NSAxNS45NTg5QzIwLjcyNTggMTYuOTgwNiAyMC42MjM3IDE3Ljk3ODYgMjAuMDkxMiAxOC44OTlDMTkuNTg2OSAxOS43NzcxIDE4Ljc1MTUgMjAuNDE0NCAxNy43NzM2IDIwLjY2NzNDMTcuMTA4MiAyMC44NDA1IDE2LjYyNzIgMjAuODEzOCAxNS45NjE3IDIwLjY5NjZDMTUuODQzNyAyMC42NjMyIDE1LjcyMTcgMjAuNjMwMyAxNS42MDQ3IDIwLjU5NDZDMTUuNDQxNCAyMC42NTI2IDE1LjM1OTggMjAuNjcyOCAxNS4yMzEyIDIwLjc5NDRDMTQuOTA3IDIxLjQ4ODcgMTQuMjExIDIyLjA4NTkgMTMuNTI5OSAyMi40MTExQzEyLjU1NjQgMjIuODY4IDExLjQ0MjQgMjIuOTE5NiAxMC40MzEzIDIyLjU1NDdDOS41OTA1MyAyMi4yNTI2IDguNzY5NDYgMjEuNjA0MiA4LjM3OTYyIDIwLjc4NTdDOC4yNzYxNSAyMC42Njk0IDguMTc0IDIwLjY0MTYgOC4wMzA3NSAyMC41ODU5TDcuNjQzNzUgMjAuNjk3QzcuMDA1NjYgMjAuODE2NSA2LjQzNTI0IDIwLjgyOTcgNS44MDIxNiAyMC42NjExQzQuODI2NzUgMjAuMzk0NyAzLjk5NjI2IDE5Ljc1MTIgMy40OTI1IDE4Ljg3MThDMi45NjIzIDE3LjkzODkgMi44NzYxNSAxNi45NTA4IDMuMTU2MzYgMTUuOTI0OEMzLjIzMjE5IDE1LjY2NzcgMy4wNzMyMyAxNS40OTAyIDIuODYxMzQgMTUuMzY4MUMyLjExODczIDE0LjkyOTcgMS42NjAzOCAxNC41MDMyIDEuMjU5NDYgMTMuNzEzNEMwLjc0OTU3NiAxMi42ODc3IDAuNjYzODMyIDExLjUwMTUgMS4wMjA4OCAxMC40MTI2QzEuMzM5MDcgOS40MzUwNyAxLjk0ODc3IDguNjg1MzggMi44NjM1NiA4LjIyMjFDMy4wNjcxNSA4LjEzMzQ0IDMuMjU5ODggNy45MjgxMiAzLjIwMzc1IDcuNjkwODdDMy4xODA1NCA3LjY1NTU4IDMuMTUwNjUgNy41MjkyIDMuMTQwODcgNy40ODQyNUMzLjAyNjU2IDYuOTU4NjcgMy4wMTUzMyA2LjQxOTY2IDMuMTI1NDMgNS44OTI0OEMzLjMzMDcxIDQuODc5OTEgMy45Mjg1OCAzLjk5MDcxIDQuNzg3MzggMy40MjA3MUM1LjczODQ1IDIuNzk4MjYgNi43MTk2NyAyLjcwNDg1IDcuODA1MzMgMi45MzYzOUM3LjkyMDMxIDIuOTcwNjIgOC4wMzYyNyAzLjAwMTQgOC4xNTMwNyAzLjAyODdDOC4zNDcxMSAyLjk1ODg1IDguMzU0MTMgMi45NTcxMSA4LjQ1NjM2IDIuNzc5OTJaIiBmaWxsPSIjRkZGQUY1Ij48L3BhdGg+CiAgPHBhdGggZD0iTTEyLjU4NSA4LjU1MjI1QzEyLjg4MDggOC4zNjI1NSAxMy4yNTYzIDguMzA4NTQgMTMuNTk2NyA4LjM4MjkzQzEzLjk3MTMgOC40NjI5MSAxNC4yOTc1IDguNjkwNTEgMTQuNTAyIDkuMDE0NTRDMTQuNjI1MyA5LjIwOTI0IDE0Ljc0ODkgOS41NjA1NiAxNC43MTY2IDkuNzg5NzJDMTQuNzE1OCA5LjkyNjM2IDE0Ljc5MDIgOS45MjU2NSAxNC45MDYgOS45NTA2N0MxNS4yOTA3IDEwLjA4NTUgMTUuNTc3MyAxMC4yOTY0IDE1Ljc1NjkgMTAuNjc0MUMxNS45MTYgMTEuMDEzIDE1LjkzMzggMTEuNDAxNyAxNS44MDY1IDExLjc1NDdDMTUuNzQ4MyAxMS45MTgyIDE1LjY1NTQgMTIuMDY5MSAxNS41NDE2IDEyLjIwMDRDMTUuNTI3MyAxMi4yMTY5IDE1LjQ4MDcgMTIuMjY4MiAxNS40NjIxIDEyLjI3NjFDMTUuNDA1NiAxMi4zNTM3IDE1LjQyODUgMTIuNDQyIDE1LjQ3OTMgMTIuNTEzOUMxNi4wNTAyIDEzLjQ5NzkgMTUuMzA0NCAxNC43NDI4IDE0LjE3NDEgMTQuNzU1OUMxNC4wODQxIDE0Ljc1MTQgMTMuOTg4OCAxNC43ODc2IDEzLjk2NzYgMTQuODg0MkMxMy44NjcgMTUuMjU1MSAxMy42NTM0IDE1LjU1MDggMTMuMzE4MyAxNS43NDM5QzEyLjk5OTkgMTUuOTI4NyAxMi42MjA5IDE1Ljk3NzUgMTIuMjY2OSAxNS44Nzk0QzEyLjAyNTkgMTUuODEyOSAxMS44NzkzIDE1LjcxNzEgMTEuNjkxIDE1LjU1OTJDMTEuNjYgMTUuNTI3MiAxMS42Mjc1IDE1LjQ5NDYgMTEuNTk3MiAxNS40NjIxQzExLjUzNTIgMTUuNDUwNyAxMS41MDU4IDE1LjQ0MjIgMTEuNDQzMiAxNS40NTcxQzExLjIxNDkgMTUuNjE2OCAxMC44ODcxIDE1LjY3ODQgMTAuNjEzNSAxNS42NTY5QzEwLjIyMzggMTUuNjIzOCA5Ljg2MzYzIDE1LjQzNzUgOS42MTE1NCAxNS4xMzg4QzkuNDAxNyAxNC44OTA4IDkuMjYxMDMgMTQuNTM3MyA5LjI4NzA5IDE0LjIwODZDOS4yNzU2NCAxNC4xNTMyIDkuMjQ4NTIgMTQuMTI1OSA5LjIxMzU1IDE0LjA4MjNMOS4wNzE0NyAxNC4wNDY5QzguODQ4OCAxMy45Njg1IDguNjY2NzYgMTMuODY5IDguNDk4MDUgMTMuNzAwOEM4LjIzOTMgMTMuNDM5NiA4LjA5NDc3IDEzLjA4NTkgOC4wOTYwMiAxMi43MTc0QzguMDk4NjcgMTIuMzI3MiA4LjI1MTIgMTIuMDAwMyA4LjUyNTk3IDExLjcyODJDOC41OTY2IDExLjY2MSA4LjU3ODgyIDExLjU3NjIgOC41MzQyOSAxMS40OTkyQzguMzgwMTQgMTEuMjI2MiA4LjMxMzM0IDExLjAwODUgOC4zMzA2OCAxMC42ODY5QzguMzU2NjEgMTAuMjcxMiA4LjU0NTI4IDkuODgyMDEgOC44NTU2OSA5LjYwNDAzQzkuMTMzNjQgOS4zNTQwMyA5LjQ2MTk1IDkuMjI4NzkgOS44MzQyNyA5LjI0OTIyQzkuOTE0NSA5LjI1ODMyIDEwLjAxMjUgOS4yMjg3IDEwLjAzOCA5LjE0Mzc4QzEwLjAzNzEgOS4xMjg0NSAxMC4wNTA3IDkuMDgzMjEgMTAuMDU1OCA5LjA2NzI4QzEwLjExNTMgOC44ODA5OCAxMC4yMDk4IDguNzA5MTkgMTAuMzQwMyA4LjU2MzE5QzEwLjU4OTEgOC4yODE2NCAxMC45MzkgOC4xMTAzMiAxMS4zMTMxIDguMDg2OTZDMTEuNzI1OCA4LjA2Mzg2IDEyLjA1MTggOC4yMTI4NSAxMi4zNTE2IDguNDgzMTZDMTIuMzgxNSA4LjUxNDg1IDEyLjQxMjUgOC41NDU2MiAxMi40NDQzIDguNTc1NDVDMTIuNTE4MSA4LjU4ODc0IDEyLjUyMDYgOC41ODk0NyAxMi41ODUgOC41NTIyNVoiIGZpbGw9IiNGODU1M0YiPjwvcGF0aD4KPC9zdmc+Cg=="),
    salat: makeImg("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KICA8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMzMEE4NzUiPjwvcmVjdD4KICA8cGF0aCBkPSJNMiAzQzIgMi40NDc3MiAyLjQ0NzcyIDIgMyAySDIxQzIxLjU1MjMgMiAyMiAyLjQ0NzcyIDIyIDNWMTRIMlYzWiIgZmlsbD0iIzhDREY1QiI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0yIDE0SDIyVjIxQzIyIDIxLjU1MjMgMjEuNTUyMyAyMiAyMSAyMkgzQzIuNDQ3NzIgMjIgMiAyMS41NTIzIDIgMjFWMTRaIiBmaWxsPSIjRTNGOEVGIj48L3BhdGg+CiAgPHJlY3QgeD0iNiIgeT0iMTQiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMDcyQTgiPjwvcmVjdD4KICA8cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMDcyQTgiPjwvcmVjdD4KPC9zdmc+Cg==")
  };

  function drawImg(img,c,x,y,s){
    if(img._ready) c.drawImage(img,x,y,s,s);
  }

  var coffeeItems=[
    {name:"Kopi", coffee:true, style:0, points:2},
  ];

  function drawCoffee(c,x,y,s,style){
    var cx=x+s/2;
    function rrect(x,y,w,h,r){
      c.beginPath();
      c.moveTo(x+r,y);
      c.lineTo(x+w-r,y);
      c.arcTo(x+w,y,x+w,y+r,r);
      c.lineTo(x+w,y+h-r);
      c.arcTo(x+w,y+h,x+w-r,y+h,r);
      c.lineTo(x+r,y+h);
      c.arcTo(x,y+h,x,y+h-r,r);
      c.lineTo(x,y+r);
      c.arcTo(x,y,x+r,y,r);
      c.closePath();
    }
    // bg
    c.fillStyle="#132B16"; c.fillRect(x,y,s,s);
    // steam wisps
    c.strokeStyle="#F5E6C8"; c.lineWidth=s*0.045; c.lineCap="round";
    c.globalAlpha=0.8;
    c.beginPath(); c.moveTo(x+s*0.25,y+s*0.22); c.bezierCurveTo(x+s*0.15,y+s*0.1,x+s*0.35,y+s*0.02,x+s*0.25,y-s*0.08); c.stroke();
    c.beginPath(); c.moveTo(x+s*0.45,y+s*0.19); c.bezierCurveTo(x+s*0.35,y+s*0.07,x+s*0.55,y-s*0.01,x+s*0.45,y-s*0.11); c.stroke();
    c.globalAlpha=1;
    // cup body fill
    c.fillStyle="#F5E6C8";
    rrect(x+s*0.04,y+s*0.25,s*0.68,s*0.68,s*0.08); c.fill();
    // cup body border
    c.strokeStyle="#C8A87A"; c.lineWidth=s*0.09; c.lineJoin="round";
    rrect(x+s*0.04,y+s*0.25,s*0.68,s*0.68,s*0.08); c.stroke();
    // coffee fill
    c.fillStyle="#3D1A08";
    rrect(x+s*0.07,y+s*0.36,s*0.62,s*0.54,s*0.06); c.fill();
    // cream layer
    c.fillStyle="#FDF5EE";
    rrect(x+s*0.07,y+s*0.36,s*0.62,s*0.1,s*0.03); c.fill();
    // handle
    c.strokeStyle="#C8A87A"; c.lineWidth=s*0.09; c.lineCap="round"; c.lineJoin="round";
    c.beginPath();
    c.moveTo(x+s*0.72,y+s*0.36);
    c.bezierCurveTo(x+s*1.08,y+s*0.36,x+s*1.08,y+s*0.72,x+s*0.72,y+s*0.72);
    c.stroke();
  }

  var kuehs=[
    {name:"Ondeh Ondeh", img:imgs.ondeh, points:1},
    // {name:"Kueh Lapis",  img:imgs.lapis,  points:1},
    {name:"Ang Ku Kueh", img:imgs.angku,  points:1},
    {name:"Kueh Bahulu", img:imgs.bahulu, points:1},
    {name:"Putu Mayam",  img:imgs.putu,   points:1},
    {name:"Kueh Salat", img:imgs.salat, points:1}
  ];


  function drawItem(item,c,x,y,s){
    if(item.coffee){ drawCoffee(c,x,y,s,item.style); }
    else { drawImg(item.img,c,x,y,s); }
  }

  function randCell(){ return {x:Math.floor(Math.random()*currentCOLS), y:Math.floor(Math.random()*currentROWS)}; }
  function randKueh(){ return kuehs[Math.floor(Math.random()*kuehs.length)]; }
  function spawnFood(bl){
    var p,t=0;
    do{ p=randCell(); t++; } while(t<300 && bl.some(function(b){return b&&b.x===p.x&&b.y===p.y;}));
    return {x:p.x, y:p.y, item:randKueh()};
  }
  function spawnCoffee(bl){
    var p,t=0;
    do{ p=randCell(); t++; } while(t<300 && (bl.some(function(b){return b&&b.x===p.x&&b.y===p.y;}) || p.y===currentROWS-1));
    var pick=coffeeItems[Math.floor(Math.random()*coffeeItems.length)];
    return {x:p.x, y:p.y, item:pick};
  }

  var snake,dir,nextDir,food,coffee,coffeeTimer,coffeeNextAt,boostUntil,score,loop,running;

  function scheduleCoffee(){
    coffee=null; coffeeTimer=null;
    coffeeNextAt=Date.now()+10000+Math.random()*15000;
  }

  function start(){
    stopBgMusic();
    document.getElementById("overlay").classList.add("hidden");
    document.getElementById("hud").classList.remove("pre-game");
    var h=window.location.hostname;
    var isLocal=h==="localhost"||h==="127.0.0.1"||h===""||h.endsWith(".local");
    var debugScore=isLocal?parseInt(new URLSearchParams(window.location.search).get("score"),10):NaN;
    score=isNaN(debugScore)?0:debugScore;
    updateGrid();
    dir={x:0,y:1}; nextDir={x:0,y:1};
    var hx=Math.floor(currentCOLS/2);
    var initialLength=3+Math.round(score*0.85);
    snake=[];
    for(var i=0;i<initialLength;i++){
      if(i<=hx){
        snake.push({x:hx-i, y:0});
      } else {
        var di=i-hx-1;
        if(di<currentROWS-1){
          snake.push({x:0, y:di+1});
        } else {
          var rest=di-(currentROWS-1);
          var scol=Math.floor(rest/currentROWS)+1;
          var srow=rest%currentROWS;
          var sx=Math.min(scol, currentCOLS-1);
          var sy=(scol%2===1)?(currentROWS-1-srow):srow;
          snake.push({x:sx, y:sy});
        }
      }
    }
    boostUntil=0;
    clearCombo();
    elScore.textContent=score;
    food=spawnFood(snake);
    coffee=null; coffeeTimer=null;
    coffeeNextAt=Date.now()+8000+Math.random()*7000;
    running=true;
    if(loop) clearInterval(loop);
    loop=setInterval(tick,NORMAL_SPEED);
    draw();
  }

  function setDir(dx,dy){
    if(!running) return;
    if(dx!==0&&dir.x!==0) return;
    if(dy!==0&&dir.y!==0) return;
    nextDir={x:dx,y:dy};
  }

  function tick(){
    dir=nextDir;
    updateGrid();
    var head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if(head.x<0||head.x>=currentCOLS||head.y<0||head.y>=currentROWS){endGame();return;}
    if(snake.some(function(s){return s.x===head.x&&s.y===head.y;})){endGame();return;}
    snake.unshift(head);
    var now=Date.now();
    if(boostUntil&&now>=boostUntil){boostUntil=0;clearInterval(loop);loop=setInterval(tick,NORMAL_SPEED);elStreak.textContent="";}
    if(!coffee&&now>=coffeeNextAt){coffee=spawnCoffee(snake.concat([food]));coffeeTimer=now;}
    if(coffee&&now-coffeeTimer>COFFEE_DURATION){scheduleCoffee();}
    var ateFood=head.x===food.x&&head.y===food.y;
    var ateCoffee=coffee&&head.x===coffee.x&&head.y===coffee.y;
    if(ateFood){
      var boosting=boostUntil&&Date.now()<boostUntil;
      var pts=boosting?2:1;
      score+=pts;
      elScore.textContent=score;
      pulseScore();
      if(boosting){
        boostCombo++;
        soundBoostEat();
        floatText(food.x*currentCellW+currentCellW/2, food.y*currentCellH, "+2!");
        edgeFlash();
        confettiBurst(food.x*currentCellW+currentCellW/2, food.y*currentCellH);
        updateStreak(true);
        if(boostCombo >= 2) showCombo(boostCombo);
      } else {
        soundEat();
        updateStreak(false);
      }
      food=spawnFood(snake.concat(coffee?[coffee]:[]));
    } else if(ateCoffee){
      score+=1;
      elScore.textContent=score;
      boostUntil=Date.now()+BOOST_DURATION;
      streakCount=0;
      clearCombo();
      clearInterval(loop); loop=setInterval(tick,BOOST_SPEED);
      soundBoost();
      floatText(coffee.x*currentCellW+currentCellW/2, coffee.y*currentCellH, "+1 BOOST!");
      edgeFlash();
      confettiBurst(coffee.x*currentCellW+currentCellW/2, coffee.y*currentCellH);
      pulseScore();
      elStreak.textContent="🔥 Boost!";
      elStreak.classList.remove("active");
      void elStreak.offsetWidth;
      elStreak.classList.add("active");
      scheduleCoffee();
    } else {
      snake.pop();
    }
    draw();
  }

  // ── Player name (localStorage) ──────────────────────────────────────
  var STORAGE_KEY = "kuehLapisPlayerName";
  function getPlayerName(){
    try {
      var n = localStorage.getItem(STORAGE_KEY);
      if(n) return n;
    } catch(e){}
    var id = Math.floor(1000 + Math.random() * 9000);
    var name = "Player " + id;
    try { localStorage.setItem(STORAGE_KEY, name); } catch(e){}
    return name;
  }
  function savePlayerName(name){
    try { localStorage.setItem(STORAGE_KEY, name); } catch(e){}
  }
  var playerName = getPlayerName();
  // The local guest identity, captured before any account sync ever runs —
  // restored verbatim on sign-out (see syncIdentityFromAccount) rather than
  // re-deriving it, so it can't end up re-reading a guest slot that a
  // signed-in rename overwrote (see the confirm-name handler, below).
  var guestPlayerName = playerName;

  // ── Player identity (localStorage) ───────────────────────────────────
  // Separate from the display name so two players choosing the same
  // nickname don't collide into the same leaderboard row.
  var STORAGE_KEY_ID = "kuehLapisPlayerId";
  function getPlayerId(){
    try {
      var id = localStorage.getItem(STORAGE_KEY_ID);
      if(id) return id;
    } catch(e){}
    var newId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){
        var r = Math.random()*16|0, v = c==="x" ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    try { localStorage.setItem(STORAGE_KEY_ID, newId); } catch(e){}
    return newId;
  }
  var playerId = getPlayerId();

  // Stable identity for the leaderboard: the signed-in account's id when
  // signed in (via the shared account widget — follows the player across
  // devices), otherwise the anonymous per-device id above (unchanged today).
  function effectivePlayerId(){
    var user = window.KuehAccount && window.KuehAccount.getUser();
    return user ? user.id : playerId;
  }

  // ── Account identity ─────────────────────────────────────────────────
  // Signed in, the account's own display_name/avatar (shared/account-
  // widget.js) become the player's identity here too — not a separate
  // per-game nickname living alongside a disconnected account system. See
  // AUTH.md's "One identity, everywhere". Signed out, everything falls
  // straight back to the local guest identity above, unchanged.
  function renderNameAvatar(){
    var signedIn = !!(window.KuehAccount && window.KuehAccount.getUser());
    // Renaming yourself while signed in is an account-level action now
    // (the account panel's own name editor — see AUTH.md), not something
    // to promote inline here alongside a name you didn't type in this game.
    document.getElementById("lbEditBtn").classList.toggle("hidden", signedIn);

    var el = document.getElementById("lbNameAvatar");
    var info = window.KuehAccount && window.KuehAccount.getAvatarInfo();
    if (!info) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.style.background = info.color || "transparent";
    el.innerHTML = '<img src="' + info.src + '" alt="" />';
    el.classList.remove("hidden");
  }

  function syncIdentityFromAccount(){
    var user = window.KuehAccount && window.KuehAccount.getUser();
    if (user) {
      var profile = window.KuehAccount.getProfile();
      var accountName = (profile && profile.display_name) || (user.email ? user.email.split("@")[0] : null);
      // Deliberately NOT saved into the local guest slot (savePlayerName) —
      // the account's name is a separate identity, not a new guest
      // fallback, or signing out would keep showing it instead of going
      // back to the local nickname/random generator.
      if (accountName && accountName !== playerName) {
        playerName = accountName;
        document.getElementById("lbNameDisplay").textContent = playerName;
      }
    } else if (playerName !== guestPlayerName) {
      // Signed out — go back to the local guest identity exactly as if
      // nobody had ever signed in on this device, not whatever the account
      // was last showing.
      playerName = guestPlayerName;
      document.getElementById("lbNameDisplay").textContent = playerName;
    }
    renderNameAvatar();
  }

  // Keeps the leaderboard overlay's sign-in hint and the player's name/
  // avatar in sync if someone signs in (or edits their avatar) via the
  // badge while this page is already open, not just on next open.
  if (window.KuehAccount) {
    KuehAccount.onAuthStateChange(function(){ updateSigninHint(); syncIdentityFromAccount(); });
    KuehAccount.onProfileChange(syncIdentityFromAccount);
    KuehAccount.ready.then(syncIdentityFromAccount);
  }

  // ── Supabase leaderboard ─────────────────────────────────────────────
  // Talks to the shared kueh-machine Supabase project via shared/account-widget.js
  // (loaded as a <script> tag in index.html) rather than owning its own
  // project/key — see AUTH.md. `liwei_scores` keeps the same shape as
  // before: public read, write your own row only (or an anonymous row,
  // player_id null-owned — see supabase/migrations/0001_init.sql).
  function fetchLeaderboard(callback){
    window.KuehAccount.ready
      .then(function(client){ return client.from("liwei_scores").select("name,score,player_id").order("score", { ascending: false }).limit(100); })
      .then(function(res){ callback(Array.isArray(res.data) ? res.data : []); })
      .catch(function(){ callback([]); });
  }

  // Checks whether `name` already belongs to a different player. Fails
  // open (treats the name as available) if the request errors out, so a
  // network hiccup can't lock someone out of naming themselves.
  function isNameTaken(name, callback){
    window.KuehAccount.ready
      .then(function(client){ return client.from("liwei_scores").select("player_id").eq("name", name); })
      .then(function(res){
        var data = res.data;
        var taken = Array.isArray(data) && data.some(function(row){ return row.player_id !== effectivePlayerId(); });
        callback(taken);
      })
      .catch(function(){ callback(false); });
  }

  var currentScoreId = null;

  function submitScore(pId, name, s, callback){
    currentScoreId = null;
    window.KuehAccount.ready
      .then(function(client){ return client.rpc("upsert_score", { p_player_id: pId, p_name: name, p_score: s }); })
      .then(function(res){ if(res.data && res.data.id) currentScoreId = res.data.id; if(callback) callback(); })
      .catch(function(){ if(callback) callback(); });
  }

  function updateScoreName(id, newName, callback){
    window.KuehAccount.ready
      .then(function(client){ return client.from("liwei_scores").update({ name: newName }).eq("id", id); })
      .then(function(){ if(callback) callback(); })
      .catch(function(){ if(callback) callback(); });
  }

  // ── Leaderboard UI ───────────────────────────────────────────────────
  var _lbScrollListener = null;

  var viewOnlyMode = false;

  function renderLeaderboard(rows, currentName, currentScore, viewOnly, currentPlayerId){
    var list = document.getElementById("lbList");
    list.innerHTML = "";

    var allRows = rows.slice();
    var youRowEl = null;

    if(!viewOnly && currentName){
      // inject current score into full ranking
      var inserted = false;
      for(var i=0;i<allRows.length;i++){
        if(allRows[i].player_id === currentPlayerId){ allRows[i].isYou = true; allRows[i].score = Math.max(allRows[i].score, currentScore); inserted = true; break; }
      }
      if(!inserted){
        for(var i=0;i<allRows.length;i++){
          if(currentScore >= allRows[i].score){ allRows.splice(i, 0, {name: currentName, score: currentScore, isYou: true}); inserted = true; break; }
        }
        if(!inserted) allRows.push({name: currentName, score: currentScore, isYou: true});
      }
    }

    var youRank = -1;
    for(var i=0;i<allRows.length;i++){
      if(allRows[i].isYou){ youRank = i+1; break; }
    }

    var rankStr = youRank===1?"🥇":youRank===2?"🥈":youRank===3?"🥉":youRank+"";
    var rankClass = youRank===1?"gold":youRank===2?"silver":youRank===3?"bronze":"";

    // render all rows
    for(var i=0;i<allRows.length;i++){
      var r = allRows[i];
      var row = document.createElement("div");
      row.className = "lb-row" + (r.isYou ? " you" : "");
      var rk = i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)+"";
      var rkClass = i===0?"gold":i===1?"silver":i===2?"bronze":"";
      row.innerHTML =
        '<span class="lb-rank '+ rkClass +'">'+ rk +'</span>'+
        '<span class="lb-entry-name">'+ (r.isYou ? r.name + " (you)" : r.name) +'</span>'+
        '<span class="lb-entry-score">'+ r.score +'</span>';
      if(r.isYou) youRowEl = row;
      list.appendChild(row);
    }

    // populate sticky bar
    var stickyRow = document.getElementById("lbStickyRow");
    var stickyBar = document.getElementById("lbStickyYou");
    if(viewOnly || youRank < 0){
      stickyBar.classList.add("hidden");
    } else {
      stickyRow.innerHTML =
        '<span class="lb-rank '+ rankClass +'">'+ rankStr +'</span>'+
        '<span class="lb-entry-name">'+ currentName +' (you)</span>'+
        '<span class="lb-entry-score">'+ currentScore +'</span>';
    }

    // scroll listener — sticky + fade hint
    var scrollWrap = document.getElementById("lbScrollWrap");
    var fade = document.getElementById("lbFade");

    function updateStickyAndFade(){
      var atBottom = list.scrollHeight - list.scrollTop <= list.clientHeight + 4;

      if(youRowEl && !viewOnly){
        var listRect = list.getBoundingClientRect();
        var rowRect = youRowEl.getBoundingClientRect();
        var rowVisible = rowRect.top < listRect.bottom - 10 && rowRect.bottom > listRect.top + 10;
        if(rowVisible){ stickyBar.classList.add("hidden"); }
        else { stickyBar.classList.remove("hidden"); }
      }

      var stickyVisible = !stickyBar.classList.contains("hidden");

      // fade: always relative to overlay-lb, not scroll-wrap
      // position it just above sticky when sticky is showing, else at bottom of scroll area
      if(atBottom){
        fade.classList.add("hidden");
      } else {
        fade.classList.remove("hidden");
        if(stickyVisible){
          // above sticky bar
          var overlayRect = document.getElementById("overlayLb").getBoundingClientRect();
          var stickyRect = stickyBar.getBoundingClientRect();
          fade.style.bottom = (overlayRect.bottom - stickyRect.top) + "px";
        } else {
          // at bottom of scroll wrap
          var overlayRect = document.getElementById("overlayLb").getBoundingClientRect();
          var footerEl = document.querySelector(".lb-footer");
          var footerRect = footerEl.getBoundingClientRect();
          fade.style.bottom = (overlayRect.bottom - footerRect.top) + "px";
        }
      }
    }

    if(_lbScrollListener) list.removeEventListener("scroll", _lbScrollListener);
    _lbScrollListener = function(){ updateStickyAndFade(); };
    list.addEventListener("scroll", _lbScrollListener);

    // initial state — only scroll if your row is below the fold
    setTimeout(function(){
      if(youRowEl){
        var listRect = list.getBoundingClientRect();
        var rowRect = youRowEl.getBoundingClientRect();
        var belowFold = rowRect.bottom > listRect.bottom - 10;
        if(belowFold){
          // scroll just enough so your row is visible at the bottom of the list
          var offset = youRowEl.offsetTop - list.clientHeight + youRowEl.offsetHeight + 16;
          list.scrollTop = Math.max(0, offset);
        }
        // if already visible, stay at top — don't scroll
      }
      updateStickyAndFade();
    }, 50);
  }

  // Shown whenever the leaderboard overlay opens and nobody's signed in —
  // scores already save fine anonymously (effectivePlayerId() falls back to
  // the localStorage UUID either way), this is just a nudge that signing in
  // carries them to another device/browser too.
  function updateSigninHint(){
    var signedIn = !!(window.KuehAccount && KuehAccount.getUser());
    document.getElementById("lbSigninHint").classList.toggle("hidden", signedIn);
  }

  function showLeaderboardViewOnly(){
    viewOnlyMode = true;
    updateSigninHint();
    document.getElementById("lbGameoverLabel").textContent = "Hall of Fame";
    document.getElementById("lbGameoverLabel").classList.add("gold");
    document.getElementById("lbScore").classList.add("hidden");
    document.getElementById("lbAteLabel").classList.add("hidden");
    document.getElementById("lbNameRow").classList.add("hidden");
    document.getElementById("btnPlayAgain").textContent = "← Back";
    document.getElementById("overlayLb").classList.remove("hidden");
    document.querySelector(".bottom-btns").classList.add("hidden");
    fetchLeaderboard(function(rows){ renderLeaderboard(rows, null, null, true); });
  }

  function showLeaderboard(){
    viewOnlyMode = false;
    updateSigninHint();
    document.getElementById("lbScore").classList.remove("hidden");
    document.getElementById("lbAteLabel").classList.remove("hidden");
    document.getElementById("lbNameRow").classList.remove("hidden");
    document.getElementById("btnPlayAgain").textContent = "Play again";
    var _low=["Oops, you bit yourself!","Ouch, tail-first into trouble.","Lapis says: watch your tail!"];
    var _mid=["So close to a full stack!","A solid plate, gone too soon.","Layered up nicely, then... oof."];
    var _high=["Now that's a feast!","Legendary lapis run.","Top-tier kueh hunting."];
    var _pool=score<6?_low:score<15?_mid:_high;
    document.getElementById("lbGameoverLabel").textContent=_pool[Math.floor(Math.random()*_pool.length)];
    document.getElementById("lbGameoverLabel").classList.remove("gold");
    document.getElementById("lbScore").textContent = score;
    document.getElementById("lbAteLabel").textContent = "You ate " + score + " kueh" + (score === 1 ? "" : "s");
    document.getElementById("lbNameDisplay").textContent = playerName;
    renderNameAvatar();
    document.getElementById("overlayLb").classList.remove("hidden");
    document.querySelector(".bottom-btns").classList.add("hidden");

    if(score > 0){
      submitScore(effectivePlayerId(), playerName, score, function(){
        fetchLeaderboard(function(rows){ renderLeaderboard(rows, playerName, score, false, effectivePlayerId()); });
      });
    } else {
      fetchLeaderboard(function(rows){ renderLeaderboard(rows, playerName, score, false, effectivePlayerId()); });
    }
  }

  function endGame(){
    running=false; clearInterval(loop);
    soundDie();
    streakCount=0;
    clearCombo();
    elStreak.textContent="";
    showLeaderboard();
  }

  document.getElementById("lbSigninLink").addEventListener("click", function(e){
    e.preventDefault();
    if (window.KuehAccount) KuehAccount.openPanel();
  });

  // ── Name edit interactions ───────────────────────────────────────────
  document.getElementById("lbEditBtn").addEventListener("click", function(){
    document.getElementById("overlayLb").classList.add("hidden");
    var input = document.getElementById("nameInput");
    input.value = playerName;
    document.getElementById("charCount").textContent = playerName.length + " / 20";
    document.getElementById("btnCancelEdit").textContent = "Keep " + playerName;
    document.getElementById("nameError").classList.add("hidden");
    document.getElementById("overlayEdit").classList.remove("hidden");
    input.focus();
  });

  document.getElementById("nameInput").addEventListener("input", function(){
    var len = this.value.length;
    document.getElementById("charCount").textContent = len + " / 20";
    document.getElementById("nameError").classList.add("hidden");
  });

  document.getElementById("btnConfirmName").addEventListener("click", function(){
    var input = document.getElementById("nameInput");
    var newName = input.value.trim();
    var nameError = document.getElementById("nameError");
    if(!newName) return;

    if(newName === playerName){
      nameError.classList.add("hidden");
      document.getElementById("overlayEdit").classList.add("hidden");
      document.getElementById("overlayLb").classList.remove("hidden");
      return;
    }

    var btn = this;
    btn.disabled = true;
    isNameTaken(newName, function(taken){
      btn.disabled = false;
      if(taken){
        nameError.textContent = "That name is taken. Try another.";
        nameError.classList.remove("hidden");
        return;
      }
      nameError.classList.add("hidden");
      playerName = newName;
      // Signed in, this IS the account's name (not a separate per-game
      // nickname) — updateProfile() pushes it to the same profiles row the
      // header badge/account panel read, so it shows up everywhere, not
      // just here. See AUTH.md's "One identity, everywhere". Signed out,
      // it's purely the local guest nickname — kept out of each other so
      // an account rename can never leak into the local guest slot (and
      // reappear after a future sign-out) or vice versa.
      var user = window.KuehAccount && window.KuehAccount.getUser();
      if (user) {
        window.KuehAccount.updateProfile({ display_name: playerName });
      } else {
        savePlayerName(playerName);
        guestPlayerName = playerName;
      }
      document.getElementById("overlayEdit").classList.add("hidden");
      document.getElementById("lbNameDisplay").textContent = playerName;
      document.getElementById("overlayLb").classList.remove("hidden");
      if(currentScoreId){
        updateScoreName(currentScoreId, playerName, function(){
          fetchLeaderboard(function(rows){ renderLeaderboard(rows, playerName, score, false, effectivePlayerId()); });
        });
      } else {
        fetchLeaderboard(function(rows){ renderLeaderboard(rows, playerName, score, false, effectivePlayerId()); });
      }
    });
  });

  document.getElementById("btnCancelEdit").addEventListener("click", function(){
    document.getElementById("nameError").classList.add("hidden");
    document.getElementById("overlayEdit").classList.add("hidden");
    document.getElementById("overlayLb").classList.remove("hidden");
  });

  document.getElementById("btnPlayAgain").addEventListener("click", function(){
    if(viewOnlyMode){
      viewOnlyMode = false;
      document.getElementById("overlayLb").classList.add("hidden");
      document.getElementById("lbScore").classList.remove("hidden");
      document.getElementById("lbAteLabel").classList.remove("hidden");
      document.getElementById("lbNameRow").classList.remove("hidden");
      document.getElementById("btnPlayAgain").textContent = "Play again";
      document.getElementById("overlay").classList.remove("hidden");
      document.querySelector(".bottom-btns").classList.remove("hidden");
      return;
    }
    try{ if(audioCtx && audioCtx.state==="suspended") audioCtx.resume(); } catch(e){}
    document.getElementById("overlayLb").classList.add("hidden");
    score = 0;
    elScore.textContent = "0";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startCountdown();
  });

  // Web Audio sound engine
  var audioCtx = null;
  var bgAudio = null;
  var musicMuted = false;

  var ICON_MUSIC_ON = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 13.5V4.5L15 2.5v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="13.5" r="2" fill="currentColor"/><circle cx="13" cy="11.5" r="2" fill="currentColor"/></svg>';
  var ICON_MUSIC_OFF = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 13.5V4.5L15 2.5v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/><circle cx="5" cy="13.5" r="2" fill="currentColor" opacity="0.35"/><circle cx="13" cy="11.5" r="2" fill="currentColor" opacity="0.35"/><line x1="2.5" y1="2.5" x2="15.5" y2="15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_LEADERBOARD = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2h8v5.5a4 4 0 0 1-8 0V2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M5 5H2.5a1.5 1.5 0 0 0 0 3H5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M13 5h2.5a1.5 1.5 0 0 1 0 3H13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11.5V15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6 15h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

  document.getElementById("btnViewLb").innerHTML = ICON_LEADERBOARD;

  function updateMusicBtn(){
    var btn = document.getElementById("btnMusic");
    if(!btn) return;
    btn.innerHTML = musicMuted ? ICON_MUSIC_OFF : ICON_MUSIC_ON;
    if(musicMuted) btn.classList.add("muted"); else btn.classList.remove("muted");
  }

  document.getElementById("btnMusic").addEventListener("click", function(){
    musicMuted = !musicMuted;
    updateMusicBtn();
    if(musicMuted){
      if(bgAudio && !bgAudio.paused){ bgAudio.pause(); }
    } else {
      if(bgAudio && bgAudio.paused){ bgAudio.play().catch(function(){}); }
    }
  });

  updateMusicBtn();

  if("mediaSession" in navigator){
    navigator.mediaSession.setActionHandler("play", function(){
      musicMuted = false;
      updateMusicBtn();
      if(bgAudio && bgAudio.paused){ bgAudio.play().catch(function(){}); }
    });
    navigator.mediaSession.setActionHandler("pause", function(){
      musicMuted = true;
      updateMusicBtn();
      if(bgAudio && !bgAudio.paused){ bgAudio.pause(); }
    });
  }

  function startBgMusic(){
    if(musicMuted) return;
    if(!bgAudio){
      bgAudio = new Audio("data:audio/mp3;base64," + SND_BGMUSIC);
      bgAudio.loop = true;
      bgAudio.volume = 0.45;
    }
    if(bgAudio.paused) bgAudio.play().catch(function(){});
  }

  function fadeBgMusic(duration, callback){
    if(!bgAudio || bgAudio.paused){ if(callback) callback(); return; }
    var steps = 30;
    var stepTime = duration / steps;
    var origVol = bgAudio.volume;
    var step = 0;
    var timer = setInterval(function(){
      step++;
      try{ bgAudio.volume = Math.max(0, origVol * (1 - step / steps)); } catch(e){}
      if(step >= steps){
        clearInterval(timer);
        try{ bgAudio.pause(); bgAudio.currentTime = 0; bgAudio.volume = origVol; } catch(e){}
        if(callback) callback();
      }
    }, stepTime);
  }

  function stopBgMusic(){
    if(bgAudio){ bgAudio.pause(); bgAudio.currentTime = 0; }
  }
  function getAudio(){ try{ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); } catch(e){ return null; } return audioCtx; }

  var soundBuffers = {eat:null, kopi:null, boost:null, die:null, count1:null, count2:null, count3:null, countGo:null};
  var _soundsInited = false;

  function initSounds(){
    if(_soundsInited) return;
    _soundsInited = true;
    var ac = getAudio(); if(!ac) return;
    function load(b64, key){
      try{
        var bin = atob(b64);
        var buf = new ArrayBuffer(bin.length);
        var view = new Uint8Array(buf);
        for(var i=0;i<bin.length;i++) view[i] = bin.charCodeAt(i);
        ac.decodeAudioData(buf, function(decoded){ soundBuffers[key] = decoded; }, function(){});
      }catch(e){}
    }
    load(SND_EAT,      "eat");
    load(SND_KOPI,     "kopi");
    load(SND_BOOST,    "boost");
    load(SND_DIE,      "die");
    load(SND_COUNT_1,  "count1");
    load(SND_COUNT_2,  "count2");
    load(SND_COUNT_3,  "count3");
    load(SND_COUNT_GO, "countGo");
  }

  function playBuffer(key){
    try{
      var ac = getAudio(); if(!ac || !soundBuffers[key]) return;
      var src = ac.createBufferSource();
      src.buffer = soundBuffers[key];
      src.connect(ac.destination);
      src.start();
    }catch(e){}
  }

  function soundEat(){ playBuffer("eat"); }
  function soundBoost(){ playBuffer("kopi"); }
  function soundBoostEat(){ playBuffer("boost"); }
  function soundDie(){ playBuffer("die"); }

  // Confetti burst
  var CONFETTI_COLORS=["#8FD400","#E8503A","#1A1030","#F2C4B2","#FFF0A0"];
  function confettiBurst(x, y){
    var wrap=document.querySelector(".game-wrap");
    var rect=canvas.getBoundingClientRect();
    var wrapRect=wrap.getBoundingClientRect();
    for(var i=0;i<12;i++){
      var el=document.createElement("div");
      el.className="confetti-piece";
      el.style.background=CONFETTI_COLORS[i%CONFETTI_COLORS.length];
      el.style.left=(rect.left-wrapRect.left+x*(rect.width/SIZE_W)+(Math.random()-0.5)*30)+"px";
      el.style.top=(rect.top-wrapRect.top+y*(rect.height/SIZE_H)+(Math.random()-0.5)*20)+"px";
      el.style.animationDelay=(Math.random()*0.15)+"s";
      wrap.appendChild(el);
      setTimeout(function(e){e.remove();},1200,el);
    }
  }

  // Combo (boost-streak) display
  var boostCombo = 0;
  var comboTimer = null;
  function showCombo(n){
    var el = document.getElementById("comboDisplay");
    if(!el) return;
    var color = n >= 10 ? "#E8503A" : n >= 5 ? "#8FD400" : "#FDF5EE";
    var shadow = n >= 10 ? "0 2px 20px rgba(232,80,58,0.7)" : n >= 5 ? "0 2px 20px rgba(143,212,0,0.6)" : "0 2px 14px rgba(255,255,255,0.35)";
    el.style.color = color;
    el.style.textShadow = shadow;
    el.textContent = "COMBO \xd7" + n;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "comboBounce 1.25s cubic-bezier(0.34,1.56,0.64,1) forwards";
    if(comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(function(){ el.style.animation = "none"; el.textContent = ""; }, 1250);
  }
  function clearCombo(){
    boostCombo = 0;
    if(comboTimer){ clearTimeout(comboTimer); comboTimer = null; }
    var el = document.getElementById("comboDisplay");
    if(el){ el.style.animation = "none"; el.textContent = ""; }
  }

  // Streak counter
  var streakCount = 0;
  function updateStreak(boosting){
    var el=elStreak;
    if(boosting){
      streakCount++;
      el.textContent = streakCount>1 ? "🔥 x"+streakCount+" COMBO!" : "🔥 Boost!";
      el.classList.remove("active");
      void el.offsetWidth;
      el.classList.add("active");
    } else {
      streakCount=0;
      // only clear if not in boost mode
      if(!(boostUntil&&Date.now()<boostUntil)) el.textContent="";
    }
  }

  function pulseScore(){
    var el=elScore;
    var sc=Math.min(1.2+streakCount*0.06, 1.5);
    el.style.setProperty("--pulse-scale", sc);
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
    setTimeout(function(){ el.classList.remove("pulse"); }, 300);
  }

  function floatText(x, y, text){
    var wrap=document.querySelector(".game-wrap");
    var el=document.createElement("div");
    el.className="float-text";
    el.textContent=text;
    // convert canvas coords to page coords
    var rect=canvas.getBoundingClientRect();
    var scaleX=rect.width/SIZE_W, scaleY=rect.height/SIZE_H;
    el.style.left=(rect.left - wrap.getBoundingClientRect().left + x*scaleX)+"px";
    el.style.top=(rect.top - wrap.getBoundingClientRect().top + y*scaleY - 10)+"px";
    wrap.appendChild(el);
    setTimeout(function(){ el.remove(); }, 900);
  }

  function edgeFlash(){
    var wrap=document.querySelector(".game-wrap");
    var el=document.createElement("div");
    el.className="edge-flash";
    wrap.appendChild(el);
    setTimeout(function(){ el.remove(); }, 500);
  }

  var ZOOM_STEPS=[
    {at:0,  cell:24},
    {at:30, cell:22},
    {at:60, cell:20},
    {at:90, cell:18},
  ];

  var currentCellW=CELL, currentCellH=CELL;
  var currentCOLS=COLS, currentROWS=ROWS;

  function updateGrid(){
    var step=ZOOM_STEPS[0];
    for(var i=0;i<ZOOM_STEPS.length;i++){
      if(score>=ZOOM_STEPS[i].at) step=ZOOM_STEPS[i];
    }
    currentCOLS=Math.max(1, Math.round(SIZE_W/step.cell));
    currentROWS=Math.max(1, Math.round(SIZE_H/step.cell));
    currentCellW=SIZE_W/currentCOLS;
    currentCellH=SIZE_H/currentROWS;
  }

  function draw(){
    var glowing=boostUntil&&Date.now()<boostUntil;

    if(snake) updateGrid();
    var CW=currentCellW, CH=currentCellH;

    ctx.clearRect(0,0,SIZE_W,SIZE_H);
    ctx.fillStyle=glowing?"#1A2E12":"#132B16";
    ctx.fillRect(0,0,SIZE_W,SIZE_H);

    ctx.strokeStyle=glowing?"rgba(143,212,0,0.12)":"rgba(255,255,255,0.07)";
    ctx.lineWidth=0.5;
    for(var i=0;i<=currentCOLS;i++){ctx.beginPath();ctx.moveTo(i*CW,0);ctx.lineTo(i*CW,SIZE_H);ctx.stroke();}
    for(var j=0;j<=currentROWS;j++){ctx.beginPath();ctx.moveTo(0,j*CH);ctx.lineTo(SIZE_W,j*CH);ctx.stroke();}

    var gL=["#8FD400","#E8C84A","#E8503A","#E8C84A","#8FD400"];
    var hL=["#2D7A3A","#F5E6C8","#D4688A","#F5E6C8","#2D7A3A"];
    var bA=["#3A8A4A","#F5E6C8","#D4788A","#F5E6C8","#3A8A4A"];
    var bB=["#D4788A","#F5E6C8","#3A8A4A","#F5E6C8","#D4788A"];

    for(var k=0;snake&&k<snake.length;k++){
      var sx=snake[k].x*CW, sy=snake[k].y*CH;
      if(glowing){ctx.shadowColor="#8FD400";ctx.shadowBlur=12;}
      var layers=glowing?gL:(k===0?hL:(k%2===0?bA:bB));
      var lh=CH/layers.length;
      for(var li=0;li<layers.length;li++){ctx.fillStyle=layers[li];ctx.fillRect(sx+1,sy+1+li*lh,CW-2,lh);}
      ctx.shadowBlur=0;
      if(k===0){
        var eyeR=Math.max(2, Math.min(CW,CH)*0.16);
        var pupR=Math.max(1, Math.min(CW,CH)*0.09);
        var ex=sx+(dir.x>0?CW-eyeR*2:dir.x<0?eyeR*2:CW/2-eyeR);
        var ey=sy+(dir.y>0?CH-eyeR*2:dir.y<0?eyeR*2:eyeR*2);
        var ex2=ex+(dir.x!==0?0:eyeR*2.5), ey2=ey+(dir.x!==0?eyeR*2.5:0);
        ctx.fillStyle="#FDF5EE";
        ctx.beginPath();ctx.arc(ex,ey,eyeR,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(ex2,ey2,eyeR,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#0A1A0D";
        ctx.beginPath();ctx.arc(ex,ey,pupR,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(ex2,ey2,pupR,0,Math.PI*2);ctx.fill();
      }
    }

    var itemS=glowing?Math.min(CW,CH)*1.25:Math.min(CW,CH), fo=glowing?(Math.min(CW,CH)-itemS)/2:0;
    if(food) drawItem(food.item,ctx,food.x*CW+fo,food.y*CH+fo,itemS);

    if(coffee){
      drawItem(coffee.item,ctx,coffee.x*CW,coffee.y*CH,Math.min(CW,CH));
      var el=Date.now()-coffeeTimer, rem=1-(el/COFFEE_DURATION);
      var bx=coffee.x*CW, by=coffee.y*CH+CH+2;
      var bw=CW, bh=3;
      ctx.fillStyle="rgba(143,212,0,0.15)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle=rem>0.4?"#8FD400":"#E8503A";
      ctx.fillRect(bx, by, bw*rem, bh);
    }

    // boost bar — fixed 5px at bottom
    if(glowing){
      var boostRem=(boostUntil-Date.now())/BOOST_DURATION;
      var barH=5, barY=SIZE_H-barH;
      ctx.fillStyle="rgba(143,212,0,0.15)";
      ctx.fillRect(0,barY,SIZE_W,barH);
      ctx.fillStyle=boostRem>0.4?"#8FD400":"#E8503A";
      ctx.fillRect(0,barY,SIZE_W*boostRem,barH);
    }
  }

  document.getElementById("btnPlay").addEventListener("click",function(){
    try{ if(audioCtx && audioCtx.state==="suspended") audioCtx.resume(); } catch(e){}
    initSounds();
    try{ startBgMusic(); } catch(e){}
    showTutorial();
  });

  document.getElementById("btnViewLb").addEventListener("click",function(){
    document.getElementById("overlay").classList.add("hidden");
    showLeaderboardViewOnly();
  });

  document.getElementById("tutBtn").addEventListener("click",function(){
    if(_fingerAnimTimer){ clearInterval(_fingerAnimTimer); clearTimeout(_fingerAnimTimer); _fingerAnimTimer=null; }
    document.getElementById("tutorial").classList.add("hidden");
    fadeBgMusic(600, startCountdown);
  });

  function showTutorial(){
    document.getElementById("overlay").classList.add("hidden");
    document.querySelector(".bottom-btns").classList.add("hidden");
    var sub = document.getElementById("tutSub");
    sub.textContent = isMobileDevice
      ? "Swipe in any direction to move the snake."
      : "Use arrow keys or WASD to move the snake.";
    document.getElementById("tutorial").classList.remove("hidden");
    startFingerAnimation();
  }

  var _fingerAnimTimer = null;
  function startFingerAnimation(){
    if(_fingerAnimTimer){ clearInterval(_fingerAnimTimer); clearTimeout(_fingerAnimTimer); }
    var dirs = ["up","right","down","left"];
    var offsets = {up:[0,-16], right:[16,0], down:[0,16], left:[-16,0]};
    var arrowIds = {up:"tutArrowUp", right:"tutArrowRight", down:"tutArrowDown", left:"tutArrowLeft"};
    var step = 0;
    var puck = document.getElementById("tutPuck");
    var glow = document.getElementById("tutGlow");
    var ripple = document.getElementById("tutRipple");

    function clearArrows(){
      ["tutArrowUp","tutArrowRight","tutArrowDown","tutArrowLeft"].forEach(function(id){
        document.getElementById(id).classList.remove("active");
      });
    }

    function animStep(){
      var dir = dirs[step % dirs.length];
      var off = offsets[dir];
      clearArrows();
      document.getElementById(arrowIds[dir]).classList.add("active");

      var t = 0, totalFrames = 22;
      _fingerAnimTimer = setInterval(function(){
        t++;
        var wave = Math.sin((t / totalFrames) * Math.PI); // 0 → 1 → 0
        var tx = 30 + off[0] * wave;
        var ty = 30 + off[1] * wave;
        puck.setAttribute("cx", tx);
        puck.setAttribute("cy", ty);
        glow.setAttribute("cx", tx);
        glow.setAttribute("cy", ty);
        // scale puck slightly on travel
        var sc = 1 + wave * 0.25;
        puck.setAttribute("r", 10 * sc);

        // ripple burst at peak
        if(t === Math.floor(totalFrames * 0.48)){
          var rT = 0;
          ripple.setAttribute("cx", tx); ripple.setAttribute("cy", ty);
          ripple.setAttribute("r","10"); ripple.setAttribute("opacity","0.8");
          var rTimer = setInterval(function(){
            rT++;
            ripple.setAttribute("r", 10 + rT * 1.6);
            ripple.setAttribute("opacity", Math.max(0, 0.8 - rT * 0.08));
            if(rT >= 10){ clearInterval(rTimer); ripple.setAttribute("opacity","0"); }
          }, 22);
        }

        if(t >= totalFrames){
          clearInterval(_fingerAnimTimer);
          // reset puck
          puck.setAttribute("cx","30"); puck.setAttribute("cy","30"); puck.setAttribute("r","10");
          glow.setAttribute("cx","30"); glow.setAttribute("cy","30");
          step++;
          _fingerAnimTimer = setTimeout(animStep, 280);
        }
      }, 28);
    }

    animStep();
  }

  function startCountdown(){
    var cd = document.getElementById("countdown");
    var num = document.getElementById("countNum");
    cd.classList.remove("hidden");
    var count = 3;
    num.textContent = count;
    num.className = "countdown-num";
    void num.offsetWidth;
    num.className = "countdown-num";

    playBuffer("count3");
    var interval = setInterval(function(){
      count--;
      if(count > 0){
        num.style.animation = "none";
        void num.offsetWidth;
        num.style.animation = "";
        num.className = "countdown-num";
        num.textContent = count;
        playBuffer(count === 2 ? "count2" : "count1");
      } else if(count === 0){
        num.style.animation = "none";
        void num.offsetWidth;
        num.style.animation = "";
        num.className = "countdown-num go";
        num.textContent = "Go!";
        playBuffer("countGo");
      } else {
        clearInterval(interval);
        cd.classList.add("hidden");
        start();
      }
    }, 900);
  }

  document.addEventListener("keydown",function(e){
    if(e.target.tagName==="INPUT") return;
    var map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    if(map[e.key]){e.preventDefault();setDir(map[e.key][0],map[e.key][1]);}
  });

  var tx,ty;
  canvas.addEventListener("touchstart",function(e){e.preventDefault();tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:false});
  canvas.addEventListener("touchmove",function(e){e.preventDefault();},{passive:false});
  canvas.addEventListener("touchend",function(e){
    e.preventDefault();
    var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
    if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0);
    else setDir(0,dy>0?1:-1);
  },{passive:false});

  // Attempt autoplay on load; if blocked, retry on first user interaction
  if(!bgAudio){
    bgAudio = new Audio("data:audio/mp3;base64," + SND_BGMUSIC);
    bgAudio.loop = true;
    bgAudio.volume = 0.45;
  }
  bgAudio.play().catch(function(){
    document.addEventListener("click", function tryBgOnInteraction(){
      startBgMusic();
      document.removeEventListener("click", tryBgOnInteraction);
    }, { once: true });
  });

  var snakePeekWrap = document.getElementById("peekSnakeOuter");
  if(snakePeekWrap){
    (function schedulePeek(){
      setTimeout(function(){
        snakePeekWrap.classList.add("peek");
        setTimeout(function(){
          snakePeekWrap.classList.remove("peek");
          schedulePeek();
        }, 8000);
      }, 10000);
    })();
  }

})();
