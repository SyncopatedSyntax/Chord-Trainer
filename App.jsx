import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";

const DC={
  'R':'#ff4757','3':'#ffd93d','b3':'#ff9f43','7':'#ff6b6b','b7':'#fdcb6e',
  '9':'#2ed573','13':'#00b894','6':'#1e9e77','#11':'#0fbcf9','5':'#778ca3',
  'b9':'#7c5cbf','#9':'#6c5ce7','b13':'#9b2335','b5':'#fd79a8','#5':'#a29bfe',
  'bb7':'#b2bec3','4':'#74b9ff','2':'#b2d9ff','11':'#81ecec',
};
const CATS={
  cowboy:{label:'Cowboy Chords',color:'#74b9ff'},
  triad:{label:'Movable Triads',color:'#ffd93d'},
  barre:{label:'Barre Chords',color:'#ff6b6b'},
  shell:{label:'Shell Chords',color:'#a29bfe'},
  drop2:{label:'Drop 2',color:'#4ecdc4'},
  drop24:{label:'Drop 2 & 4',color:'#00b894'},
  ext:{label:'Extensions',color:'#fd79a8'},
  altered:{label:'Altered',color:'#e17055'},
};
const NOTE_NAMES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const OPEN_MIDI=[40,45,50,55,59,64];

const CHORDS=[
  {id:'cC',name:'C Major',sym:'C',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}]},
  {id:'cG',name:'G Major',sym:'G',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}]},
  {id:'cD',name:'D Major',sym:'D',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}]},
  {id:'cE',name:'E Major',sym:'E',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}]},
  {id:'cA',name:'A Major',sym:'A',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,2,0],deg:[null,'R','5','R','3','5'],sf:1}]},
  {id:'cF',name:'F Major',sym:'F',cat:'cowboy',voicings:[{label:'1st pos barre',str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}]},
  {id:'cEm',name:'E Minor',sym:'Em',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,0,0],deg:['R','5','R','b3','5','R'],sf:1}]},
  {id:'cAm',name:'A Minor',sym:'Am',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}]},
  {id:'cDm',name:'D Minor',sym:'Dm',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,1],deg:[null,null,'R','5','R','b3'],sf:1}]},
  {id:'cE7',name:'E7',sym:'E7',cat:'cowboy',voicings:[{label:'Open',str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}]},
  {id:'cA7',name:'A7',sym:'A7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}]},
  {id:'cD7',name:'D7',sym:'D7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}]},
  {id:'cG7',name:'G7',sym:'G7',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,1],deg:['R','3','5','R','3','b7'],sf:1}]},
  {id:'cC7',name:'C7',sym:'C7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,3,1,0],deg:[null,'R','3','b7','R','3'],sf:1}]},
  {id:'cB7',name:'B7',sym:'B7',cat:'cowboy',voicings:[{label:'Open',str:[-1,2,1,2,0,2],deg:[null,'R','3','b7','R','5'],sf:1}]},
  {id:'cEm7',name:'Em7',sym:'Em7',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}]},
  {id:'cAm7',name:'Am7',sym:'Am7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}]},
  {id:'cDm7',name:'Dm7',sym:'Dm7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}]},
  {id:'cCmaj7',name:'Cmaj7',sym:'Cmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,0,0],deg:[null,'R','3','5','7','3'],sf:1}]},
  {id:'cGmaj7',name:'Gmaj7',sym:'Gmaj7',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,0,0,2],deg:['R','3','5','R','3','7'],sf:1}]},
  {id:'cDmaj7',name:'Dmaj7',sym:'Dmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,2,2],deg:[null,null,'R','5','7','3'],sf:1}]},
  {id:'cAmaj7',name:'Amaj7',sym:'Amaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,1,2,0],deg:[null,'R','5','7','3','5'],sf:1}]},
  {id:'cFmaj7',name:'Fmaj7',sym:'Fmaj7',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}]},
  {id:'cDsus2',name:'Dsus2',sym:'Dsus2',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,0],deg:[null,null,'R','5','R','2'],sf:1}]},
  {id:'cDsus4',name:'Dsus4',sym:'Dsus4',cat:'cowboy',voicings:[{label:'Open',str:[-1,-1,0,2,3,3],deg:[null,null,'R','5','R','4'],sf:1}]},
  {id:'cAsus2',name:'Asus2',sym:'Asus2',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,0,0],deg:[null,'R','5','R','2','5'],sf:1}]},
  {id:'cAsus4',name:'Asus4',sym:'Asus4',cat:'cowboy',voicings:[{label:'Open',str:[-1,0,2,2,3,0],deg:[null,'R','5','R','4','5'],sf:1}]},
  {id:'cEsus4',name:'Esus4',sym:'Esus4',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,2,0,0],deg:['R','5','R','4','5','R'],sf:1}]},
  {id:'cCadd9',name:'Cadd9',sym:'Cadd9',cat:'cowboy',voicings:[{label:'Open',str:[-1,3,2,0,3,0],deg:[null,'R','3','5','9','3'],sf:1}]},
  {id:'cGadd9',name:'Gadd9',sym:'Gadd9',cat:'cowboy',voicings:[{label:'Open',str:[3,2,0,2,0,3],deg:['R','3','5','9','3','R'],sf:1}]},
  {id:'cEm9',name:'Em9',sym:'Em9',cat:'cowboy',voicings:[{label:'Open',str:[0,2,2,0,3,2],deg:['R','5','R','b3','b7','9'],sf:1}]},
  {id:'cCmaj9',name:'Cmaj9',sym:'Cmaj9',cat:'cowboy',voicings:[{label:'Open x30000',str:[-1,3,0,0,0,0],deg:[null,'R','9','5','7','3'],sf:1}]},
  {id:'cDfsh',name:'D/F#',sym:'D/F#',cat:'cowboy',voicings:[{label:'Open 1st inv',str:[2,0,0,2,3,2],deg:['3','5','R','5','R','3'],sf:1}]},
  {id:'cGb',name:'G/B',sym:'G/B',cat:'cowboy',voicings:[{label:'Open 1st inv',str:[-1,2,0,0,3,3],deg:[null,'3','5','R','5','R'],sf:1}]},
  {id:'cE7s9',name:'E7#9',sym:'E7#9',cat:'cowboy',voicings:[{label:'Hendrix chord',str:[0,2,0,0,3,0],deg:['R','5','b7','b3','b7','R'],sf:1}]},
  {id:'tMr_dgb',name:'Major root pos',sym:'maj',cat:'triad',movable:true,voicings:[{label:'D-G-B R-3-5 · ex A@5fr',str:[-1,-1,7,6,5,-1],deg:[null,null,'R','3','5',null],sf:5}]},
  {id:'tM1_dgb',name:'Major 1st inv',sym:'maj/3',cat:'triad',movable:true,voicings:[{label:'D-G-B 3-5-R · ex D@4fr',str:[-1,-1,4,2,3,-1],deg:[null,null,'3','5','R',null],sf:2}]},
  {id:'tM2_dgb',name:'Major 2nd inv',sym:'maj/5',cat:'triad',movable:true,voicings:[{label:'D-G-B 5-R-3 · ex A@2fr',str:[-1,-1,2,2,2,-1],deg:[null,null,'5','R','3',null],sf:2}]},
  {id:'tmr_dgb',name:'Minor root pos',sym:'min',cat:'triad',movable:true,voicings:[{label:'D-G-B R-b3-5 · ex Am@5fr',str:[-1,-1,7,5,5,-1],deg:[null,null,'R','b3','5',null],sf:5}]},
  {id:'tm1_dgb',name:'Minor 1st inv',sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'D-G-B b3-5-R · ex Em@4fr',str:[-1,-1,5,4,5,-1],deg:[null,null,'b3','5','R',null],sf:4}]},
  {id:'tm2_dgb',name:'Minor 2nd inv',sym:'min/5',cat:'triad',movable:true,voicings:[{label:'D-G-B 5-R-b3 · ex Am@1fr',str:[-1,-1,2,2,1,-1],deg:[null,null,'5','R','b3',null],sf:1}]},
  {id:'taug_dgb',name:'Augmented',sym:'aug',cat:'triad',movable:true,voicings:[{label:'D-G-B R-3-#5',str:[-1,-1,3,2,2,-1],deg:[null,null,'R','3','#5',null],sf:2}]},
  {id:'tdim_dgb',name:'Diminished',sym:'dim',cat:'triad',movable:true,voicings:[{label:'D-G-B R-b3-b5',str:[-1,-1,9,7,6,-1],deg:[null,null,'R','b3','b5',null],sf:6}]},
  {id:'tsus2_dgb',name:'Sus2',sym:'sus2',cat:'triad',movable:true,voicings:[{label:'D-G-B R-2-5',str:[-1,-1,5,2,3,-1],deg:[null,null,'R','2','5',null],sf:2}]},
  {id:'tsus4_dgb',name:'Sus4',sym:'sus4',cat:'triad',movable:true,voicings:[{label:'D-G-B R-4-5',str:[-1,-1,7,7,5,-1],deg:[null,null,'R','4','5',null],sf:5}]},
  {id:'tMr_gbe',name:'Major root pos',sym:'maj',cat:'triad',movable:true,voicings:[{label:'G-B-e R-3-5 · ex C@3fr',str:[-1,-1,-1,5,5,3],deg:[null,null,null,'R','3','5'],sf:3}]},
  {id:'tM1_gbe',name:'Major 1st inv',sym:'maj/3',cat:'triad',movable:true,voicings:[{label:'G-B-e 3-5-R · ex G@3fr',str:[-1,-1,-1,4,3,3],deg:[null,null,null,'3','5','R'],sf:3}]},
  {id:'tM2_gbe',name:'Major 2nd inv',sym:'maj/5',cat:'triad',movable:true,voicings:[{label:'G-B-e 5-R-3 · ex F@5fr',str:[-1,-1,-1,5,6,5],deg:[null,null,null,'5','R','3'],sf:5}]},
  {id:'tmr_gbe',name:'Minor root pos',sym:'min',cat:'triad',movable:true,voicings:[{label:'G-B-e R-b3-5 · ex Bm@2fr',str:[-1,-1,-1,4,3,2],deg:[null,null,null,'R','b3','5'],sf:2}]},
  {id:'tm1_gbe',name:'Minor 1st inv',sym:'min/b3',cat:'triad',movable:true,voicings:[{label:'G-B-e b3-5-R · ex Am@5fr',str:[-1,-1,-1,5,5,5],deg:[null,null,null,'b3','5','R'],sf:5}]},
  {id:'tm2_gbe',name:'Minor 2nd inv',sym:'min/5',cat:'triad',movable:true,voicings:[{label:'G-B-e 5-R-b3 · ex Em@3fr',str:[-1,-1,-1,4,5,3],deg:[null,null,null,'5','R','b3'],sf:3}]},
  {id:'taug_gbe',name:'Augmented',sym:'aug',cat:'triad',movable:true,voicings:[{label:'G-B-e R-3-#5',str:[-1,-1,-1,5,5,4],deg:[null,null,null,'R','3','#5'],sf:4}]},
  {id:'tdim_gbe',name:'Diminished',sym:'dim',cat:'triad',movable:true,voicings:[{label:'G-B-e R-b3-b5',str:[-1,-1,-1,4,3,1],deg:[null,null,null,'R','b3','b5'],sf:1}]},
  {id:'tsus2_gbe',name:'Sus2',sym:'sus2',cat:'triad',movable:true,voicings:[{label:'G-B-e R-2-5',str:[-1,-1,-1,5,3,3],deg:[null,null,null,'R','2','5'],sf:3}]},
  {id:'tsus4_gbe',name:'Sus4',sym:'sus4',cat:'triad',movable:true,voicings:[{label:'G-B-e R-4-5',str:[-1,-1,-1,5,6,3],deg:[null,null,null,'R','4','5'],sf:3}]},
  {id:'bEMaj',name:'Maj E-shape',sym:'maj',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex A@5fr',str:[5,7,7,6,5,5],deg:['R','5','R','3','5','R'],sf:5}]},
  {id:'bEMin',name:'Min E-shape',sym:'min',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Am@5fr',str:[5,7,7,5,5,5],deg:['R','5','R','b3','5','R'],sf:5}]},
  {id:'bE7',name:'Dom7 E-shape',sym:'7',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex A7@5fr',str:[5,7,5,6,5,5],deg:['R','5','b7','3','5','R'],sf:5}]},
  {id:'bEMaj7',name:'Maj7 E-shape',sym:'maj7',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Amaj7@5fr',str:[5,7,6,6,5,5],deg:['R','5','7','3','5','R'],sf:5}]},
  {id:'bESus4',name:'Sus4 E-shape',sym:'sus4',cat:'barre',movable:true,voicings:[{label:'6th-str root · ex Asus4@5fr',str:[5,7,7,7,5,5],deg:['R','5','R','4','5','R'],sf:5}]},
  {id:'bAMaj',name:'Maj A-shape',sym:'maj',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex D@5fr',str:[-1,5,7,7,7,5],deg:[null,'R','5','R','3','5'],sf:5}]},
  {id:'bAMin',name:'Min A-shape',sym:'min',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dm@5fr',str:[-1,5,7,7,6,5],deg:[null,'R','5','R','b3','5'],sf:5}]},
  {id:'bA7',name:'Dom7 A-shape',sym:'7',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex D7@5fr',str:[-1,5,7,5,7,5],deg:[null,'R','5','b7','3','5'],sf:5}]},
  {id:'bAMaj7',name:'Maj7 A-shape',sym:'maj7',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dmaj7@5fr',str:[-1,5,7,6,7,5],deg:[null,'R','5','7','3','5'],sf:5}]},
  {id:'bASus4',name:'Sus4 A-shape',sym:'sus4',cat:'barre',movable:true,voicings:[{label:'5th-str root · ex Dsus4@5fr',str:[-1,5,7,7,8,5],deg:[null,'R','5','R','4','5'],sf:5}]},
  {id:'sh7_6',name:'Dom7 Shell 6th',sym:'7',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b7-3 · ex G7',str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}]},
  {id:'sh7_5',name:'Dom7 Shell 5th',sym:'7',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-3-b7 · ex D7',str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}]},
  {id:'shMaj7_6',name:'Maj7 Shell 6th',sym:'Δ',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-7-3 · ex Gmaj7',str:[3,-1,4,4,-1,-1],deg:['R',null,'7','3',null,null],sf:1}]},
  {id:'shMaj7_5',name:'Maj7 Shell 5th',sym:'Δ',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-3-7 · ex Cmaj7',str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}]},
  {id:'shm7_6',name:'Min7 Shell 6th',sym:'m7',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b7-b3 · ex Am7',str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}]},
  {id:'shm7_5',name:'Min7 Shell 5th',sym:'m7',cat:'shell',movable:true,voicings:[{label:'5-4-3 R-b3-b7 · ex Cm7',str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1}]},
  {id:'shdim7',name:'Dim7 Shell',sym:'°7',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b5-bb7',str:[7,-1,3,1,-1,-1],deg:['R',null,'b5','bb7',null,null],sf:1}]},
  {id:'shm7b5',name:'Half-dim Shell',sym:'ø',cat:'shell',movable:true,voicings:[{label:'6-4-3 R-b5-b7',str:[7,-1,3,2,-1,-1],deg:['R',null,'b5','b7',null,null],sf:1}]},
  {id:'d2maj7_6',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-3-7',str:[3,3,2,4,-1,-1],deg:['5','R','3','7',null,null],sf:2}]},
  {id:'d2dom7_6',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-3-b7',str:[3,3,2,3,-1,-1],deg:['5','R','3','b7',null,null],sf:2}]},
  {id:'d2min7_6',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'6543 5-R-b3-b7',str:[3,3,1,3,-1,-1],deg:['5','R','b3','b7',null,null],sf:1}]},
  {id:'d2m7b5_6',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'6543 b5-R-b3-b7',str:[2,3,1,3,-1,-1],deg:['b5','R','b3','b7',null,null],sf:1}]},
  {id:'d2maj7_5',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-3-7 · ex Gmaj7',str:[-1,5,5,4,7,-1],deg:[null,'5','R','3','7',null],sf:4}]},
  {id:'d2dom7_5',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-3-b7 · ex G7',str:[-1,5,5,4,6,-1],deg:[null,'5','R','3','b7',null],sf:4}]},
  {id:'d2min7_5',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'5432 5-R-b3-b7 · ex Gm7',str:[-1,5,5,3,6,-1],deg:[null,'5','R','b3','b7',null],sf:3}]},
  {id:'d2m7b5_5',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'5432 b5-R-b3-b7',str:[-1,4,5,3,6,-1],deg:[null,'b5','R','b3','b7',null],sf:3}]},
  {id:'d2dim7_5',name:'Dim7 Drop2',sym:'°7',cat:'drop2',movable:true,voicings:[{label:'5432 R-b5-bb7-b3',str:[-1,2,3,1,3,-1],deg:[null,'R','b5','bb7','b3',null],sf:1}]},
  {id:'d2maj7_4',name:'Maj7 Drop2',sym:'Δ',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-3-7',str:[-1,-1,5,5,5,7],deg:[null,null,'5','R','3','7'],sf:5}]},
  {id:'d2dom7_4',name:'Dom7 Drop2',sym:'7',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-3-b7',str:[-1,-1,5,5,5,6],deg:[null,null,'5','R','3','b7'],sf:5}]},
  {id:'d2min7_4',name:'Min7 Drop2',sym:'m7',cat:'drop2',movable:true,voicings:[{label:'4321 5-R-b3-b7',str:[-1,-1,5,5,4,6],deg:[null,null,'5','R','b3','b7'],sf:4}]},
  {id:'d2m7b5_4',name:'m7b5 Drop2',sym:'ø',cat:'drop2',movable:true,voicings:[{label:'4321 b5-R-b3-b7',str:[-1,-1,4,5,4,6],deg:[null,null,'b5','R','b3','b7'],sf:4}]},
  {id:'d24maj7',name:'Maj7 Drop2&4',sym:'Δ',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-7-3-5',str:[5,-1,6,6,5,-1],deg:['R',null,'7','3','5',null],sf:5}]},
  {id:'d24dom7',name:'Dom7 Drop2&4',sym:'7',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-3-5',str:[5,-1,5,6,5,-1],deg:['R',null,'b7','3','5',null],sf:5}]},
  {id:'d24min7',name:'Min7 Drop2&4',sym:'m7',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-b3-5',str:[5,-1,5,5,5,-1],deg:['R',null,'b7','b3','5',null],sf:5}]},
  {id:'d24m7b5',name:'m7b5 Drop2&4',sym:'ø',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-b3-b5',str:[5,-1,5,5,4,-1],deg:['R',null,'b7','b3','b5',null],sf:4}]},
  {id:'d24maj6',name:'Maj6 Drop2&4',sym:'6',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-6-3-5',str:[5,-1,4,6,5,-1],deg:['R',null,'6','3','5',null],sf:4}]},
  {id:'d247sus4',name:'7sus4 Drop2&4',sym:'7sus4',cat:'drop24',movable:true,voicings:[{label:'6-4-3-2 R-b7-4-5',str:[3,-1,3,5,3,-1],deg:['R',null,'b7','4','5',null],sf:1}]},
  {id:'dom9',name:'Dom 9',sym:'9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-b7-9 · ex G9',str:[3,2,3,2,-1,-1],deg:['R','3','b7','9',null,null],sf:1}]},
  {id:'maj9',name:'Maj 9',sym:'maj9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-7-9 · ex Gmaj9',str:[3,2,4,2,-1,-1],deg:['R','3','7','9',null,null],sf:1}]},
  {id:'min9',name:'Min 9',sym:'m9',cat:'ext',movable:true,voicings:[{label:'6543 R-b3-b7-9 · ex Gm9',str:[3,1,3,2,-1,-1],deg:['R','b3','b7','9',null,null],sf:1}]},
  {id:'dom13',name:'Dom 13',sym:'13',cat:'ext',movable:true,voicings:[{label:'6-5-4-2 R-3-b7-13',str:[3,2,3,-1,5,-1],deg:['R','3','b7',null,'13',null],sf:2}]},
  {id:'maj7s11',name:'Maj7 #11',sym:'Δ#11',cat:'ext',movable:true,voicings:[{label:'6543 R-3-7-#11 Lydian',str:[3,2,4,6,-1,-1],deg:['R','3','7','#11',null,null],sf:2}]},
  {id:'maj6',name:'Major 6',sym:'6',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-6-3-5',str:[3,-1,2,4,3,-1],deg:['R',null,'6','3','5',null],sf:1}]},
  {id:'min6',name:'Minor 6',sym:'m6',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-6-b3-5',str:[5,-1,4,5,5,-1],deg:['R',null,'6','b3','5',null],sf:4}]},
  {id:'dom69',name:'6/9 Chord',sym:'6/9',cat:'ext',movable:true,voicings:[{label:'6543 R-3-6-9',str:[3,2,2,2,-1,-1],deg:['R','3','6','9',null,null],sf:2}]},
  {id:'dom11',name:'Dom 11',sym:'11',cat:'ext',movable:true,voicings:[{label:'6-4-3-2 R-b7-9-11',str:[3,-1,3,2,1,-1],deg:['R',null,'b7','9','11',null],sf:1}]},
  {id:'dom7sus4',name:'Dom7 Sus4',sym:'7sus4',cat:'ext',movable:true,voicings:[{label:'6-5-4-3 R-5-b7-4',str:[3,5,3,5,-1,-1],deg:['R','5','b7','4',null,null],sf:3}]},
  {id:'dom7b9',name:'Dom 7b9',sym:'7b9',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-b9 · ex G7b9',str:[3,2,3,1,-1,-1],deg:['R','3','b7','b9',null,null],sf:1}]},
  {id:'dom7s9',name:'Dom 7#9',sym:'7#9',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-#9 Hendrix',str:[3,2,3,3,-1,-1],deg:['R','3','b7','#9',null,null],sf:1}]},
  {id:'dom7s11',name:'Dom 7#11',sym:'7#11',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-#11',str:[3,2,3,6,-1,-1],deg:['R','3','b7','#11',null,null],sf:1}]},
  {id:'dom7b13',name:'Dom 7b13',sym:'7b13',cat:'altered',movable:true,voicings:[{label:'6543 R-3-b7-b13',str:[3,2,3,4,-1,-1],deg:['R','3','b7','b13',null,null],sf:1}]},
  {id:'m7b5',name:'Half-dim m7b5',sym:'ø',cat:'altered',movable:true,voicings:[{label:'6543 R-b3-b5-b7 · ex Bø',str:[7,5,3,2,-1,-1],deg:['R','b3','b5','b7',null,null],sf:2}]},
  {id:'dim7',name:'Dim7 Full',sym:'°7',cat:'altered',movable:true,voicings:[{label:'5432 R-b5-bb7-b3',str:[-1,2,3,1,3,-1],deg:[null,'R','b5','bb7','b3',null],sf:1}]},
];

const PROGS=[
  {title:'ii–V–I · C major',feel:'Jazz',desc:'The cornerstone of jazz. Dm7 creates tension, G7 raises it, Cmaj7 resolves.',chords:[{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}}]},
  {title:'I–VI–ii–V · C major',feel:'Jazz',desc:'Classic turnaround — relative minor and subdominant before resolving.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Am7',rn:'vi',v:{str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'12-Bar Blues · E',feel:'Blues',desc:'The foundation of blues, rock, and jazz. Three open dominant 7ths.',chords:[{sym:'E7',rn:'I7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}},{sym:'A7',rn:'IV7',v:{str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}},{sym:'B7',rn:'V7',v:{str:[-1,2,1,2,0,2],deg:[null,'R','3','b7','R','5'],sf:1}}]},
  {title:'Minor ii–V–i · A minor',feel:'Jazz',desc:'The half-diminished and altered dominant are hallmarks of jazz minor.',chords:[{sym:'Bø',rn:'iiø',v:{str:[7,5,3,2,-1,-1],deg:['R','b3','b5','b7',null,null],sf:2}},{sym:'E7b9',rn:'V7b9',v:{str:[0,2,3,1,3,0],deg:['R','5','b9','3','b7','R'],sf:1}},{sym:'Am7',rn:'i',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}}]},
  {title:'I–IV–V · G major',feel:'Folk/Country',desc:'Three chords, a million songs. The backbone of folk, country, and rock.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}},{sym:'D',rn:'V',v:{str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}}]},
  {title:'I–V–vi–IV · G major',feel:'Pop',desc:'The "4 chord" pop progression — underlies hundreds of hit songs.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'D',rn:'V',v:{str:[-1,-1,0,2,3,2],deg:[null,null,'R','5','R','3'],sf:1}},{sym:'Em',rn:'vi',v:{str:[0,2,2,0,0,0],deg:['R','5','R','b3','5','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}}]},
  {title:'Andalusian Cadence · Am',feel:'Flamenco',desc:'Am–G–F–E. Descending minor with Phrygian flavour. Ancient and cinematic.',chords:[{sym:'Am',rn:'i',v:{str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}},{sym:'G',rn:'VII',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'VI',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'E',rn:'V',v:{str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}}]},
  {title:'Drop 2 · ii–V–I in G',feel:'Jazz Comping',desc:'Smooth voice leading with Drop 2 voicings on strings 5-4-3-2.',chords:[{sym:'Am7',rn:'ii',v:{str:[-1,7,7,5,8,-1],deg:[null,'5','R','b3','b7',null],sf:5}},{sym:'D7',rn:'V',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'Gmaj7',rn:'I',v:{str:[-1,5,5,4,7,-1],deg:[null,'5','R','3','7',null],sf:4}}]},
  {title:'Autumn Leaves · opening',feel:'Jazz Standard',desc:'Dm7–G7–Cmaj7–Fmaj7, descending through the cycle of 4ths.',chords:[{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[1,-1,2,2,-1,-1],deg:['R',null,'7','3',null,null],sf:1}}]},
  {title:'Bossa Nova · F major',feel:'Bossa Nova',desc:'Fmaj7–Dm7–Gm7–C7sus4. Cool, laid-back Brazilian jazz harmony.',chords:[{sym:'Fmaj7',rn:'I',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'Dm7',rn:'vi',v:{str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}},{sym:'Gm7',rn:'ii',v:{str:[3,-1,3,3,-1,-1],deg:['R',null,'b7','b3',null,null],sf:1}},{sym:'C7sus4',rn:'V',v:{str:[-1,3,3,3,-1,-1],deg:[null,'R','4','b7',null,null],sf:1}}]},
  {title:'Rhythm Changes · A section',feel:'Bebop',desc:"Gershwin's I Got Rhythm in Bb — backbone of bebop for 80+ years.",chords:[{sym:'Bbmaj7',rn:'I',v:{str:[6,-1,7,7,-1,-1],deg:['R',null,'7','3',null,null],sf:5}},{sym:'Gm7',rn:'vi',v:{str:[3,-1,3,3,-1,-1],deg:['R',null,'b7','b3',null,null],sf:1}},{sym:'Cm7',rn:'ii',v:{str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1}},{sym:'F7',rn:'V',v:{str:[1,-1,1,2,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Jazz Turnaround · C',feel:'Jazz',desc:'Cmaj7–A7–Dm7–G7. Cycle-of-4ths turnaround with secondary dominant.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'A7',rn:'VI7',v:{str:[5,-1,5,6,-1,-1],deg:['R',null,'b7','3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Giant Steps · opening',feel:'Bebop/Modern',desc:"Coltrane's Maj7 chords a major 3rd apart — a cycle that shook jazz harmony.",chords:[{sym:'Bmaj7',rn:'I',v:{str:[7,-1,8,8,-1,-1],deg:['R',null,'7','3',null,null],sf:6}},{sym:'D7',rn:'V/G',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'Gmaj7',rn:'I',v:{str:[3,-1,4,4,-1,-1],deg:['R',null,'7','3',null,null],sf:1}}]},
  {title:'12-Bar Blues · A',feel:'Blues',desc:'Classic shuffle in A — I7, IV7, V7.',chords:[{sym:'A7',rn:'I7',v:{str:[-1,0,2,0,2,0],deg:[null,'R','5','b7','3','5'],sf:1}},{sym:'D7',rn:'IV7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}},{sym:'E7',rn:'V7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}}]},
  {title:'So What · D minor',feel:'Modal Jazz',desc:"Miles Davis Kind of Blue. The 'So What' chord stacks 4ths, creating a floating Dorian quality.",chords:[{sym:'Dm11',rn:'i',v:{str:[-1,5,5,5,6,-1],deg:[null,'R','4','b7','b3',null],sf:5}},{sym:'Ebm11',rn:'bii',v:{str:[-1,6,6,6,7,-1],deg:[null,'R','4','b7','b3',null],sf:6}}]},
  {title:'Rhythm Changes · B section',feel:'Bebop',desc:'D7–G7–C7–F7. The circle-of-dominants bridge — each chord a 5th apart.',chords:[{sym:'D7',rn:'VI7',v:{str:[-1,5,4,5,-1,-1],deg:[null,'R','3','b7',null,null],sf:4}},{sym:'G7',rn:'II7',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'C7',rn:'V7',v:{str:[-1,3,2,3,-1,-1],deg:[null,'R','3','b7',null,null],sf:1}},{sym:'F7',rn:'I7',v:{str:[1,-1,1,2,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Minor Blues · Am',feel:'Blues',desc:'Am7–Dm7–E7b9. Darker and more melancholic than the major blues.',chords:[{sym:'Am7',rn:'i7',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}},{sym:'Dm7',rn:'iv7',v:{str:[-1,-1,0,2,1,1],deg:[null,null,'R','5','b7','b3'],sf:1}},{sym:'E7b9',rn:'V7b9',v:{str:[0,2,3,1,3,0],deg:['R','5','b9','3','b7','R'],sf:1}}]},
  {title:'I–bVII–IV · G major',feel:'Rock',desc:'G–F–C. Borrowing the bVII from Mixolydian gives rock its raw, anthemic quality.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'bVII',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}}]},
  {title:'i–bVII–bVI–V · A minor',feel:'Rock / Classical',desc:'Am–G–F–E. Natural minor descent. Dramatic and cinematic.',chords:[{sym:'Am',rn:'i',v:{str:[-1,0,2,2,1,0],deg:[null,'R','5','R','b3','5'],sf:1}},{sym:'G',rn:'bVII',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'F',rn:'bVI',v:{str:[1,3,3,2,1,1],deg:['R','5','R','3','5','R'],sf:1}},{sym:'E',rn:'V',v:{str:[0,2,2,1,0,0],deg:['R','5','R','3','5','R'],sf:1}}]},
  {title:'I–iii–IV–V · C major',feel:'Pop / Soul',desc:'Cmaj7–Em7–Fmaj7–G7. The mediant (iii) gives a flowing, optimistic quality.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Em7',rn:'iii',v:{str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'G7',rn:'V',v:{str:[3,2,0,0,0,1],deg:['R','3','5','R','3','b7'],sf:1}}]},
  {title:'Gospel · G major',feel:'Gospel',desc:'G–C–D7–G. The timeless gospel cadence. Simple, powerful.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'C',rn:'IV',v:{str:[-1,3,2,0,1,0],deg:[null,'R','3','5','R','3'],sf:1}},{sym:'D7',rn:'V7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}},{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}}]},
  {title:'Dorian Vamp · Dm',feel:'Jazz / Fusion',desc:'Dm7–G7 with no resolution. Modal floating quality.',chords:[{sym:'Dm7',rn:'i7',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'IV7',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Neo-Soul · C major',feel:'Neo-Soul / R&B',desc:'Cmaj7–E7–Fmaj7–Fm7. The chromatic III7→iv shift is the signature neo-soul colour change.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'E7',rn:'III7',v:{str:[0,2,0,1,0,0],deg:['R','5','b7','3','5','R'],sf:1}},{sym:'Fmaj7',rn:'IV',v:{str:[-1,3,3,2,1,0],deg:[null,'5','R','3','5','7'],sf:1}},{sym:'Fm7',rn:'iv7',v:{str:[-1,8,6,8,-1,-1],deg:[null,'R','b3','b7',null,null],sf:6}}]},
  {title:'Tritone Sub · C',feel:'Jazz',desc:'Cmaj7–Db7–Dm7–G7. Db7 substitutes for G7, creating a smooth chromatic bass line.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Db7',rn:'bII7',v:{str:[9,-1,9,10,-1,-1],deg:['R',null,'b7','3',null,null],sf:9}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
  {title:'Samba · G major',feel:'Samba / Brazilian',desc:'G–Em7–Am7–D7. Circular I–vi–ii–V with a driving Brazilian rhythmic feel.',chords:[{sym:'G',rn:'I',v:{str:[3,2,0,0,0,3],deg:['R','3','5','R','3','R'],sf:1}},{sym:'Em7',rn:'vi',v:{str:[0,2,2,0,3,0],deg:['R','5','R','b3','b7','R'],sf:1}},{sym:'Am7',rn:'ii',v:{str:[-1,0,2,0,1,0],deg:[null,'R','5','b7','b3','5'],sf:1}},{sym:'D7',rn:'V7',v:{str:[-1,-1,0,2,1,2],deg:[null,null,'R','5','b7','3'],sf:1}}]},
  {title:'Coltrane Cycle · C',feel:'Bebop / Modern',desc:'Cmaj7–Abmaj7–E7–Abmaj7. Simplified Giant Steps cycle — three tonal centres a major 3rd apart.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Abmaj7',rn:'bVI',v:{str:[4,-1,5,5,-1,-1],deg:['R',null,'7','3',null,null],sf:4}},{sym:'E7',rn:'III7',v:{str:[0,-1,0,1,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}},{sym:'Abmaj7',rn:'bVI',v:{str:[4,-1,5,5,-1,-1],deg:['R',null,'7','3',null,null],sf:4}}]},
  {title:'Jazz Waltz · C',feel:'Jazz Waltz',desc:'Cmaj7–Am7–Dm7–G7 in 3/4. The lilting waltz feel gives familiar harmony new life.',chords:[{sym:'Cmaj7',rn:'I',v:{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1}},{sym:'Am7',rn:'vi',v:{str:[5,-1,5,5,-1,-1],deg:['R',null,'b7','b3',null,null],sf:5}},{sym:'Dm7',rn:'ii',v:{str:[-1,5,3,5,-1,-1],deg:[null,'R','b3','b7',null,null],sf:3}},{sym:'G7',rn:'V',v:{str:[3,-1,3,4,-1,-1],deg:['R',null,'b7','3',null,null],sf:1}}]},
];

const DEG_HINT={
  'R':'root — tonal centre','3':'major 3rd — makes it major','b3':'minor 3rd — makes it minor',
  'b7':'dominant 7th — tension','7':'major 7th — colour & lift','b9':'flat 9 — dark tension',
  '#9':'sharp 9 — Hendrix note','#11':'sharp 11 — Lydian brightness','b13':'flat 13 — altered colour',
  '5':'perfect 5th — stability','b5':'flat 5 — tritone','#5':'augmented 5th',
  '13':'13th — open extension','9':'9th — extension','6':'6th — sweet addition',
  'bb7':'diminished 7th','4':'suspended 4th','2':'sus2 open',
};

// ── CHORD FAMILY FILTER ── Option A: sonic families ──────────────────────
const FAMILIES=[
  {id:'major',    label:'Major',    sym:'maj', color:'#ffd93d', desc:'Triads · maj7 · add9 · 6/9'},
  {id:'dominant', label:'Dominant', sym:'7',   color:'#fd79a8', desc:'Dom7 · 9 · 13 · altered'},
  {id:'minor',    label:'Minor',    sym:'m',   color:'#74b9ff', desc:'Minor triads · m7 · m9 · m6'},
  {id:'halfdim',  label:'Half-dim', sym:'ø',   color:'#fdcb6e', desc:'m7♭5 — minor triad + ♭5 + ♭7'},
  {id:'dim',      label:'Dim',      sym:'°',   color:'#b2bec3', desc:'Dim triads · dim7 — fully symmetric'},
  {id:'aug',      label:'Aug',      sym:'+',   color:'#a29bfe', desc:'Augmented — major triad + ♯5'},
  {id:'sus',      label:'Sus',      sym:'sus', color:'#55efc4', desc:'Sus2 · Sus4 · 7sus4 — no 3rd'},
];
// Each test is lenient on shell chords (3-note voicings that omit the 3rd by design)
const FAMILY_TESTS={
  major:    d=>d.has('3')&&!d.has('b3')&&!d.has('b7'),           // major triad quality, no ♭7 (excludes dom)
  dominant: d=>d.has('3')&&d.has('b7')&&!d.has('b3'),            // major triad + ♭7
  minor:    d=>d.has('b3')&&!d.has('b5')&&!d.has('bb7'),         // minor triad, no flat 5 (excludes halfdim/dim)
  halfdim:  d=>d.has('b5')&&d.has('b7')&&!d.has('bb7'),          // ♭5 + ♭7 (lenient: catches shells without ♭3)
  dim:      d=>d.has('b5')&&!d.has('b7')&&(d.has('b3')||d.has('bb7')), // ♭5 + no ♭7; needs ♭3 or °7 (catches dim shells)
  aug:      d=>d.has('#5'),
  sus:      d=>(d.has('4')||d.has('2'))&&!d.has('3')&&!d.has('b3'),
};

// ── CHORD BUILDER ── Option C: additive construction ──────────────────────
const TRIADS=[
  {id:'major',sym:'maj',label:'Major', color:'#ffd93d',hint:'R · 3 · 5'},
  {id:'minor',sym:'m',  label:'Minor', color:'#74b9ff',hint:'R · ♭3 · 5'},
  {id:'sus2', sym:'sus2',label:'Sus 2',color:'#55efc4',hint:'R · 2 · 5'},
  {id:'sus4', sym:'sus4',label:'Sus 4',color:'#00b894',hint:'R · 4 · 5'},
  {id:'aug',  sym:'+',  label:'Aug',   color:'#a29bfe',hint:'R · 3 · ♯5'},
  {id:'dim',  sym:'°',  label:'Dim',   color:'#b2bec3',hint:'R · ♭3 · ♭5'},
];
// Triad tests — "dim" is lenient to catch shell voicings that omit ♭3
const TRIAD_TESTS={
  major: d=>d.has('3')&&!d.has('b3')&&!d.has('b5')&&!d.has('#5'),
  minor: d=>d.has('b3')&&!d.has('b5'),   // pure minor quality, no flat 5
  sus2:  d=>d.has('2')&&!d.has('3')&&!d.has('b3'),
  sus4:  d=>d.has('4')&&!d.has('3')&&!d.has('b3'),
  aug:   d=>d.has('#5'),
  dim:   d=>d.has('b5')&&!d.has('3'),    // lenient: any chord with ♭5 and no major 3rd
};

const SEVENTHS=[
  {id:'dom', sym:'♭7',label:'Min 7th', color:'#fd79a8',hint:'minor 7th interval'},
  {id:'maj', sym:'Δ7', label:'Maj 7th', color:'#00b894',hint:'major 7th interval'},
  {id:'dim7',sym:'°7', label:'Dim 7th', color:'#e17055',hint:'diminished 7th (♭♭7)'},
];
const SEVENTH_TESTS={
  dom:  d=>d.has('b7')&&!d.has('bb7'),
  maj:  d=>d.has('7'),
  dim7: d=>d.has('bb7'),
};

// Builder combination labels (triad|seventh)
const BUILDER_COMBO={
  'major|dom': {label:'Dominant 7th',    color:'#fd79a8'},
  'major|maj': {label:'Major 7th',       color:'#00b894'},
  'minor|dom': {label:'Minor 7th',       color:'#4ecdc4'},
  'minor|maj': {label:'Minor-Maj 7',     color:'#a8e6cf'},
  'dim|dom':   {label:'Half-dim  ø',     color:'#fdcb6e'},
  'dim|dim7':  {label:'Full Dim  °7',    color:'#e17055'},
  'sus4|dom':  {label:'Dom 7sus4',       color:'#0984e3'},
  'sus2|dom':  {label:'Dom 7sus2',       color:'#55efc4'},
  'aug|dom':   {label:'Aug Dominant',    color:'#a29bfe'},
};

const EXTS=[
  {id:'6',   sym:'6',    color:'#1e9e77'},
  {id:'9',   sym:'9',    color:'#2ed573'},
  {id:'b9',  sym:'♭9',   color:'#e17055'},
  {id:'s9',  sym:'♯9',   color:'#6c5ce7'},
  {id:'11',  sym:'11',   color:'#81ecec'},
  {id:'s11', sym:'♯11',  color:'#0fbcf9'},
  {id:'13',  sym:'13',   color:'#00b894'},
  {id:'b13', sym:'♭13',  color:'#d63031'},
];
const EXT_TESTS={
  '6':   d=>d.has('6'),
  '9':   d=>d.has('9'),
  'b9':  d=>d.has('b9'),
  's9':  d=>d.has('#9'),
  '11':  d=>d.has('11'),
  's11': d=>d.has('#11'),
  '13':  d=>d.has('13'),
  'b13': d=>d.has('b13'),
};



const FEEL_TO_CAT={
  'Jazz':'Jazz','Bebop':'Jazz','Bebop/Modern':'Jazz','Jazz Standard':'Jazz','Jazz Waltz':'Jazz','Modal Jazz':'Jazz','Jazz / Fusion':'Jazz','Jazz Comping':'Jazz',
  'Blues':'Blues','Gospel/Blues':'Blues','Minor Blues':'Blues',
  'Pop':'Rock & Pop','Pop/50s':'Rock & Pop','Pop/Soul':'Rock & Pop','Pop / Soul':'Rock & Pop','Pop/Rock':'Rock & Pop','Folk/Country':'Rock & Pop','Rock':'Rock & Pop','Rock/Classical':'Rock & Pop','Rock/Modal':'Rock & Pop','Rock / Classical':'Rock & Pop',
  'R&B/Soul':'Soul & R&B','Neo-Soul/R&B':'Soul & R&B','Neo-Soul':'Soul & R&B','Neo-Soul / R&B':'Soul & R&B','Funk/Soul':'Soul & R&B','Gospel':'Soul & R&B',
  'Bossa Nova':'Latin','Samba':'Latin','Samba / Brazilian':'Latin','Flamenco':'Latin','Tango':'Latin',
  'Classical':'Classical',
};
const BROAD_CATS=[
  {id:'Jazz',label:'Jazz',emoji:'🎷',color:'#a29bfe'},
  {id:'Blues',label:'Blues',emoji:'🎸',color:'#ff6b6b'},
  {id:'Rock & Pop',label:'Rock & Pop',emoji:'🎵',color:'#ffd93d'},
  {id:'Soul & R&B',label:'Soul & R&B',emoji:'🎹',color:'#fd79a8'},
  {id:'Latin',label:'Latin',emoji:'🪗',color:'#00b894'},
  {id:'Classical',label:'Classical',emoji:'🎼',color:'#74b9ff'},
];

// ── PERSISTENT STORAGE ───────────────────────────────────────────────────
// localStorage persists across sessions in standalone PWA (home screen launch).
// window.storage is Claude's artifact sandbox API — works inside claude.ai but
// starts fresh when Safari launches the page as a standalone PWA.
// Strategy: write to BOTH, read localStorage first.
const store={
  async get(key){
    try{const v=localStorage.getItem(key);if(v!==null)return{value:v};}catch(e){}
    try{if(typeof window.storage!=='undefined'){const r=await window.storage.get(key);if(r)return r;}}catch(e){}
    return null;
  },
  async set(key,value){
    try{localStorage.setItem(key,value);}catch(e){}
    try{if(typeof window.storage!=='undefined')await store.set(key,value);}catch(e){}
  },
};

const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const todayStr=()=>new Date().toISOString().split('T')[0];
const addDays=(d,n)=>{const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0];};

function updateSRS(card,correct){
  const ef=card?.ef??2.5,reps=card?.reps??0,interval=card?.interval??1;
  if(correct){const nef=Math.min(2.5,Math.max(1.3,ef+0.1));const nreps=reps+1;const nint=nreps===1?1:nreps===2?6:Math.round(interval*nef);return{ef:nef,interval:nint,reps:nreps,nextDue:addDays(todayStr(),nint)};}
  return{ef:Math.max(1.3,ef-0.2),interval:1,reps:0,nextDue:addDays(todayStr(),1)};
}
function getWeakChords(history,srs){
  const map={};
  for(const h of history){if(!map[h.id])map[h.id]={ok:0,n:0};map[h.id].n++;if(h.correct)map[h.id].ok++;}
  const weak=new Set();
  for(const[id,s]of Object.entries(map)){if(s.ok<s.n)weak.add(id);}
  for(const[id,s]of Object.entries(srs||{})){if(s.ef<2.0)weak.add(id);}
  return CHORDS.filter(c=>weak.has(c.id)).map(c=>({...c,stats:map[c.id]||{ok:0,n:0},srsEf:srs?.[c.id]?.ef}))
    .sort((a,b)=>{const pa=a.stats.n>0?a.stats.ok/a.stats.n:0.5;const pb=b.stats.n>0?b.stats.ok/b.stats.n:0.5;return pa-pb;});
}
function getWeakDegrees(degHist){
  const map={};
  for(const h of degHist){const k=h.id+'|'+h.deg;if(!map[k])map[k]={id:h.id,deg:h.deg,ok:0,n:0};map[k].n++;if(h.correct)map[k].ok++;}
  return Object.values(map).filter(r=>r.ok/r.n<0.7)
    .map(r=>({...r,chord:CHORDS.find(c=>c.id===r.id)})).filter(r=>r.chord)
    .sort((a,b)=>a.ok/a.n-b.ok/b.n);
}
// Seeded pseudo-random number generator (mulberry32) — deterministic for a given seed
function seededRng(seed){
  return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
// Simple string → number hash for seeding
function strHash(s){let h=0;for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;}return h;}

function seededShuffle(arr,seed){
  const a=[...arr],rng=seededRng(seed);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function getDailyChords(srsData){
  const td=todayStr();
  const seed=strHash(td); // same seed all day → same order on every reload
  const due=CHORDS.filter(c=>srsData[c.id]?.nextDue<=td);
  const fresh=CHORDS.filter(c=>!srsData[c.id]);
  const seen=new Set();const result=[];
  for(const c of [...seededShuffle(due,seed),...seededShuffle(fresh,seed+1)]){
    if(!seen.has(c.id)){seen.add(c.id);result.push(c);}
    if(result.length>=5)break;
  }
  return result;
}
function getCharDegs(chord){
  const degs=[...new Set((chord.voicings[0].deg||[]).filter(Boolean))];
  const nonRoot=degs.filter(d=>d!=='R');
  const prio=['b9','#9','#11','b13','13','9','b7','7','b3','3','b5','#5','6','bb7','4','2','5'];
  const found=prio.filter(d=>nonRoot.includes(d));
  const interesting=found.filter(d=>d!=='5');
  return interesting.length>0?interesting.slice(0,3):(found.length>0?found.slice(0,2):nonRoot.slice(0,2));
}

function getRootNote(v){
  for(let i=0;i<v.str.length;i++){if(v.deg?.[i]==='R'&&v.str[i]>=0)return((OPEN_MIDI[i]+v.str[i])%12+12)%12;}
  return null;
}
function getValidTransposeRoots(v){
  const rootIdx=v.deg.findIndex((d,i)=>d==='R'&&v.str[i]>0);
  if(rootIdx===-1)return new Set();
  const currentNote=((OPEN_MIDI[rootIdx]+v.str[rootIdx])%12+12)%12;
  const valid=new Set();
  for(let target=0;target<12;target++){
    let shift=((target-currentNote)+12)%12;if(shift>6)shift-=12;
    const newStr=v.str.map(f=>f>0?f+shift:f);
    if(v.str.every((f,i)=>f<=0||newStr[i]>=1))valid.add(target);
  }
  return valid;
}
function transposeVoicing(v,targetNote){
  const rootIdx=v.deg.findIndex((d,i)=>d==='R'&&v.str[i]>0);
  if(rootIdx===-1)return v;
  const currentNote=((OPEN_MIDI[rootIdx]+v.str[rootIdx])%12+12)%12;
  let shift=((targetNote-currentNote)+12)%12;if(shift>6)shift-=12;if(shift===0)return v;
  const newStr=v.str.map(f=>f>0?f+shift:f);
  if(!v.str.every((f,i)=>f<=0||newStr[i]>=1))return v;
  const active=newStr.filter(f=>f>0);
  return{...v,str:newStr,sf:Math.max(1,active.length>0?Math.min(...active):1)};
}

let _ctx=null,_unlocked=false;
function getCtx(){if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();if(_ctx.state==='suspended')_ctx.resume();return _ctx;}
function unlockAudio(){
  if(_unlocked)return;
  const ctx=getCtx();
  const buf=ctx.createBuffer(1,1,22050);const src=ctx.createBufferSource();
  src.buffer=buf;src.connect(ctx.destination);src.start(0);
  ctx.resume().then(()=>{_unlocked=true;});
}
function pluckNote(ctx,freq,when,vol=0.16){
  [[1,1.0],[2,0.45],[3,0.22],[4,0.09],[6,0.04]].forEach(([h,a])=>{
    const osc=ctx.createOscillator(),g=ctx.createGain(),filt=ctx.createBiquadFilter();
    osc.type='sine';osc.frequency.value=freq*h;filt.type='lowpass';filt.frequency.value=Math.min(3200,freq*h*3);
    g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol*a,when+0.005);g.gain.exponentialRampToValueAtTime(0.0001,when+(h===1?1.6:0.9));
    osc.connect(filt);filt.connect(g);g.connect(ctx.destination);osc.start(when);osc.stop(when+2);
  });
}
function midiToHz(m){return 440*Math.pow(2,(m-69)/12);}
function playVoicing(v,mode){
  unlockAudio();
  const ctx=getCtx(),now=ctx.currentTime+0.04;
  const notes=v.str.map((f,i)=>f>=0?midiToHz(OPEN_MIDI[i]+f):null).filter(Boolean);
  const gap=mode==='arp'?0.10:0.016;
  notes.forEach((hz,i)=>pluckNote(ctx,hz,now+i*gap));
}
function PlayButtons({v,size,stack}){
  const[active,setActive]=useState(null);
  const nc=v.str.filter(f=>f>=0).length;
  const play=mode=>{setActive(mode);playVoicing(v,mode);setTimeout(()=>setActive(null),mode==='arp'?nc*110+800:600);};
  const sm=size==='sm';
  const btn=mode=>({background:active===mode?'#ffd93d15':'transparent',border:`1px solid ${active===mode?'#ffd93d':'#2a2840'}`,color:active===mode?'#ffd93d':'#888',borderRadius:'7px',padding:sm?'4px 9px':'7px 15px',fontSize:sm?'11px':'12px',cursor:'pointer',fontWeight:600,transition:'all .15s',minHeight:sm?'30px':'38px',width:stack?'100%':'auto'});
  // stopPropagation on both onClick AND onTouchStart:
  // Safari synthesises a click from touchend and bubbles it up through the DOM,
  // reaching any parent tappable div (e.g. the chord detail opener). Firefox Mobile
  // doesn't exhibit this — it consumes the touch at the button level. Blocking both
  // events ensures the play action never opens the chord detail on any browser.
  const stop=e=>e.stopPropagation();
  return(
    <div
      style={{display:'flex',flexDirection:stack?'column':'row',gap:'5px',alignItems:'stretch'}}
      onClick={stop}
      onTouchStart={stop}
    >
      <button onClick={e=>{stop(e);play('arp');}} style={btn('arp')}>♩ Arp</button>
      <button onClick={e=>{stop(e);play('strum');}} style={btn('strum')}>♬ Strum</button>
    </div>
  );
}

function ChordDiagram({v,showDeg,size}){
  const sc=size||1;if(!v)return null;
  const{str,deg,sf}=v;
  const active=str.filter(f=>f>0);
  const maxF=active.length>0?Math.max(...active):sf;
  const nFrets=Math.max(5,maxF-sf+1);
  const ML=12,GW=64,RPAD=46,MT=30,MB=6,FS=21;
  const W=ML+GW+RPAD,H=MT+nFrets*FS+MB,SS=GW/5,DR=5.2;
  const sx=i=>ML+i*SS,fy=f=>MT+(f-sf+0.5)*FS;
  const dots=[];
  for(let i=0;i<str.length;i++){
    const fret=str[i],x=sx(i),d=deg?.[i],isR=d==='R';
    if(fret===-1){const y=MT-14,s=3.5;dots.push(<g key={i}><line x1={x-s} y1={y-s} x2={x+s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/><line x1={x+s} y1={y-s} x2={x-s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/></g>);}
    else if(fret===0){
      const cy=MT-14,fill=showDeg&&d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'none'),strokeC=showDeg&&d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'#74b9ff'),tFill=fill==='none'?'#74b9ff':'#111';
      dots.push(<g key={i}><circle cx={x} cy={cy} r={4.25} fill={fill} stroke={strokeC} strokeWidth={1.9}/>{d&&showDeg&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={tFill} fontWeight="bold" fontFamily="sans-serif">{d}</text>}</g>);
    }else{
      const cy=fy(fret),fill=showDeg&&d?(DC[d]||'#ffd93d'):(isR?'#ff4757':'#ffd93d');
      dots.push(<g key={i}><circle cx={x} cy={cy} r={DR} fill={fill}/>{d&&showDeg&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill="#111" fontWeight="bold" fontFamily="sans-serif">{d}</text>}</g>);
    }
  }
  return(<svg viewBox={`0 0 ${W} ${H}`} width={W*sc} height={H*sc} style={{display:'block'}}>
    {Array.from({length:nFrets+1},(_,j)=><line key={j} x1={ML} y1={MT+j*FS} x2={ML+GW} y2={MT+j*FS} stroke={j===0&&sf===1?'#bbb':'#2a2840'} strokeWidth={j===0&&sf===1?3:1.5}/>)}
    {[0,1,2,3,4,5].map(i=><line key={i} x1={sx(i)} y1={MT} x2={sx(i)} y2={MT+nFrets*FS} stroke="#2a2840" strokeWidth={1.5}/>)}
    {sf>1&&<text x={ML+GW+10} y={MT+FS*0.68} fontSize={10} fill="#bbb" fontFamily="monospace" textAnchor="start">{sf}fr</text>}
    {dots}
  </svg>);
}

function ClickableDiagram({v,onDotClick,selIdx,revealed,targetDeg,size}){
  const sc=size||2;if(!v)return null;
  const{str,deg,sf}=v;
  const active=str.filter(f=>f>0),maxF=active.length>0?Math.max(...active):sf,nFrets=Math.max(5,maxF-sf+1);
  const ML=12,GW=64,RPAD=46,MT=30,MB=6,FS=21;
  const W=ML+GW+RPAD,H=MT+nFrets*FS+MB,SS=GW/5,DR=5.2;
  const sx=i=>ML+i*SS,fy=f=>MT+(f-sf+0.5)*FS;
  const dots=[];
  for(let i=0;i<str.length;i++){
    const fret=str[i],x=sx(i),d=deg?.[i],isR=d==='R';
    if(fret===-1){const y=MT-14,s=3.5;dots.push(<g key={i}><line x1={x-s} y1={y-s} x2={x+s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/><line x1={x+s} y1={y-s} x2={x-s} y2={y+s} stroke="#e74c3c" strokeWidth={1.9} strokeLinecap="round"/></g>);}
    else if(fret===0){
      const cy=MT-14,isSel=selIdx===i,isC=revealed&&d===targetDeg,isW=revealed&&isSel&&!isC;
      const fill=revealed?(isC?'#00b894':isW?'#ff6363':(d?(DC[d]||'#74b9ff'):(isR?'#ff4757':'none'))):(isSel?'#a29bfe':(isR?'#ff4757':'none'));
      const strokeC=revealed?(isC?'#00b894':isW?'#ff6363':(d?(DC[d]||'#74b9ff'):'#74b9ff')):(isSel?'#a29bfe':isR?'#ff4757':'#74b9ff');
      const tFill=fill==='none'?'#74b9ff':'#111';
      dots.push(<g key={i} onClick={()=>onDotClick&&onDotClick(i)} style={{cursor:onDotClick?'pointer':'default'}}>
        <circle cx={x} cy={cy} r={DR*2.8} fill="transparent"/>
        <circle cx={x} cy={cy} r={4.25} fill={fill} stroke={strokeC} strokeWidth={(isC||isSel)?2.5:1.9}/>
        {revealed&&d&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={tFill} fontWeight="bold" fontFamily="sans-serif">{d}</text>}
      </g>);
    }else{
      const cy=fy(fret),isSel=selIdx===i,isC=revealed&&d===targetDeg,isW=revealed&&isSel&&!isC;
      let fill=isR?'#ff4757':'#ffd93d';
      if(revealed){fill=DC[d]||'#ffd93d';if(isC)fill='#00b894';if(isW)fill='#ff6363';}
      else if(isSel)fill='#a29bfe';
      dots.push(<g key={i} onClick={()=>onDotClick&&onDotClick(i)} style={{cursor:onDotClick?'pointer':'default'}}>
        <circle cx={x} cy={cy} r={DR*2.8} fill="transparent"/>
        <circle cx={x} cy={cy} r={DR} fill={fill}/>
        {revealed&&d&&<text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={d.length>2?5:d.length>1?6:7} fill={isC||isW?'#fff':'#111'} fontWeight="bold" fontFamily="sans-serif">{d}</text>}
      </g>);
    }
  }
  return(<svg viewBox={`0 0 ${W} ${H}`} width={W*sc} height={H*sc} style={{display:'block',touchAction:'manipulation'}}>
    {Array.from({length:nFrets+1},(_,j)=><line key={j} x1={ML} y1={MT+j*FS} x2={ML+GW} y2={MT+j*FS} stroke={j===0&&sf===1?'#bbb':'#2a2840'} strokeWidth={j===0&&sf===1?3:1.5}/>)}
    {[0,1,2,3,4,5].map(i=><line key={i} x1={sx(i)} y1={MT} x2={sx(i)} y2={MT+nFrets*FS} stroke="#2a2840" strokeWidth={1.5}/>)}
    {sf>1&&<text x={ML+GW+10} y={MT+FS*0.68} fontSize={10} fill="#bbb" fontFamily="monospace" textAnchor="start">{sf}fr</text>}
    {dots}
  </svg>);
}

const DEG_TIERS=[
  {label:'Guide Tones ★★★',degs:['3','b3','7','b7']},
  {label:'Safe Extensions ★★',degs:['9','13','6','#11']},
  {label:'Tension Tones ⚡',degs:['b9','#9','b13','b5','#5','bb7']},
  {label:'Root & Neutral',degs:['R','5']},
  {label:'Suspended',degs:['4','2','11']},
];
const DEFAULT_DEGS=new Set(['3','b3','7','b7','9','13','6','#11','b9','#9','b13','b5','#5','bb7']);
const DEG_TOTAL=10;

function ScaleDegreeQuiz({onSaveDeg}){
  const[phase,setPhase]=useState('intro');
  const[selDegs,setSelDegs]=useState(DEFAULT_DEGS);
  const[chord,setChord]=useState(null);
  const[targetDeg,setTargetDeg]=useState(null);
  const[selIdx,setSelIdx]=useState(-1);
  const[revealed,setRevealed]=useState(false);
  const[score,setScore]=useState(0);
  const[qi,setQi]=useState(0);
  const[waitNext,setWaitNext]=useState(false);
  const[sessionResults,setSessionResults]=useState([]);
  const toggleDeg=d=>setSelDegs(prev=>{const n=new Set(prev);if(n.has(d)){if(n.size>1)n.delete(d);}else n.add(d);return n;});
  const nextQ=useCallback((activeDegSet)=>{
    let c,deg,tries=0;
    do{c=shuffle([...CHORDS])[0];const av=getCharDegs(c).filter(d=>activeDegSet.has(d));deg=av.length>0?av[Math.floor(Math.random()*av.length)]:null;tries++;}while(!deg&&tries<40);
    if(!deg)return;
    setChord(c);setTargetDeg(deg);setSelIdx(-1);setRevealed(false);setWaitNext(false);
  },[]);
  const start=()=>{setScore(0);setQi(0);setSessionResults([]);nextQ(selDegs);setPhase('quiz');};
  const handleNext=()=>{const nqi=qi+1;if(nqi>=DEG_TOTAL){onSaveDeg&&onSaveDeg(sessionResults);setPhase('done');}else{setQi(nqi);nextQ(selDegs);}};
  const handleDot=idx=>{
    if(revealed)return;
    const v=chord.voicings[0];if(v.str[idx]===-1)return;
    setSelIdx(idx);
    const correct=v.deg?.[idx]===targetDeg;
    const res={id:chord.id,deg:targetDeg,correct};
    setSessionResults(p=>[...p,res]);
    if(correct){setScore(s=>s+1);setRevealed(true);setTimeout(()=>{const nqi=qi+1;if(nqi>=DEG_TOTAL){onSaveDeg&&onSaveDeg([...sessionResults,res]);setPhase('done');}else{setQi(nqi);nextQ(selDegs);}},1200);}
    else{setRevealed(true);setWaitNext(true);}
  };
  if(phase==='intro')return(
    <div style={{padding:'18px 16px',maxWidth:'420px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <div style={{fontSize:'40px',marginBottom:'6px'}}>🎼</div>
        <h2 style={{fontSize:'22px',fontWeight:900,margin:'0 0 8px',color:'#fff'}}>Scale Degree Trainer</h2>
        <p style={{color:'#ccc',margin:'0',fontSize:'13px',lineHeight:'1.6'}}>Tap the dot matching the asked degree.</p>
      </div>
      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'11px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'8px'}}>Degrees to practise · <span style={{color:'#ffd93d'}}>{selDegs.size} selected</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {DEG_TIERS.map(tier=>(
            <div key={tier.label} style={{background:'#13121f',borderRadius:'9px',padding:'9px 10px',border:'1px solid #2a2840'}}>
              <div style={{fontSize:'10px',color:'#777',marginBottom:'6px',fontWeight:600}}>{tier.label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                {tier.degs.map(d=>{const on=selDegs.has(d);return(
                  <button key={d} onClick={()=>toggleDeg(d)} style={{padding:'4px 10px',borderRadius:'12px',cursor:'pointer',fontSize:'12px',fontWeight:700,background:on?(DC[d]||'#ffd93d')+'22':'transparent',color:on?(DC[d]||'#ffd93d'):'#555',border:`1px solid ${on?(DC[d]||'#ffd93d')+'66':'#2a2840'}`,transition:'all .15s',minHeight:'30px'}}>{d}</button>
                );})}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={start} style={{display:'block',width:'100%',background:'#ffd93d',color:'#111',border:'none',padding:'14px',borderRadius:'11px',fontSize:'15px',fontWeight:900,cursor:'pointer'}}>Start Training 🎼</button>
    </div>
  );
  if(phase==='done'){
    const pct=Math.round(score/DEG_TOTAL*100);
    return(<div style={{padding:'28px 14px',maxWidth:'360px',margin:'0 auto',textAlign:'center'}}>
      <div style={{fontSize:'54px',marginBottom:'5px'}}>{pct===100?'🏆':pct>=80?'⭐':pct>=60?'🎯':'💪'}</div>
      <div style={{fontSize:'20px',fontWeight:800,marginBottom:'3px',color:'#fff'}}>{pct>=80?'Sharp ears!':pct>=60?'Getting there!':'Keep practising!'}</div>
      <div style={{fontSize:'58px',fontWeight:900,color:'#ffd93d',lineHeight:1,marginBottom:'3px'}}>{score}/{DEG_TOTAL}</div>
      <div style={{color:'#aaa',marginBottom:'18px'}}>{pct}% correct</div>
      <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
        <button onClick={()=>setPhase('intro')} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'10px 20px',borderRadius:'9px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Settings</button>
        <button onClick={start} style={{background:'#ffd93d',color:'#111',border:'none',padding:'10px 28px',borderRadius:'9px',fontSize:'13px',fontWeight:800,cursor:'pointer'}}>Again</button>
      </div>
    </div>);
  }
  if(!chord||!targetDeg)return null;
  const v=chord.voicings[0];
  const isCorrect=revealed&&(v.deg||[]).some((d,i)=>d===targetDeg&&i===selIdx);
  return(
    <div style={{padding:'12px',maxWidth:'420px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'#999',fontSize:'11px'}}>Q{qi+1}/{DEG_TOTAL}</span><span style={{color:'#ffd93d',fontSize:'11px',fontWeight:700}}>{score} correct</span></div>
        <div style={{background:'#1a1928',borderRadius:'3px',height:'4px'}}><div style={{background:'linear-gradient(90deg,#ff6b6b,#ffd93d)',height:'4px',borderRadius:'3px',width:`${(qi/DEG_TOTAL)*100}%`,transition:'width .3s'}}/></div>
      </div>
      <div style={{textAlign:'center',marginBottom:'10px'}}>
        <div style={{fontSize:'22px',fontWeight:900,color:'#fff'}}>{chord.name}</div>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',marginTop:'5px',fontSize:'12px'}}>
          <span><span style={{color:'#ff4757',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Root</span></span>
          <span><span style={{color:'#ffd93d',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Note</span></span>
          {revealed&&<><span><span style={{color:'#00b894',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Correct</span></span><span><span style={{color:'#ff6363',fontWeight:700}}>●</span> <span style={{color:'#aaa'}}>Wrong</span></span></>}
        </div>
      </div>
      <div style={{textAlign:'center',marginBottom:'12px',padding:'9px',background:'#13121f',borderRadius:'10px',border:`1px solid ${DC[targetDeg]||'#ffd93d'}44`}}>
        <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'3px'}}>Tap the</div>
        <div style={{fontSize:'30px',fontWeight:900,color:DC[targetDeg]||'#ffd93d'}}>{targetDeg}</div>
        {revealed&&<div style={{fontSize:'11px',color:'#aaa',marginTop:'4px',fontStyle:'italic'}}>{DEG_HINT[targetDeg]||''}</div>}
      </div>
      <div style={{display:'flex',justifyContent:'center',marginBottom:'10px'}}>
        <div style={{background:'#13121f',borderRadius:'14px',padding:'14px',border:`1px solid ${!revealed?'#2a2840':isCorrect?'#00b894':'#ff6363'}`,transition:'border-color .3s'}}>
          <ClickableDiagram v={v} onDotClick={!revealed?handleDot:null} selIdx={selIdx} revealed={revealed} targetDeg={targetDeg} size={1.9}/>
        </div>
      </div>
      {revealed&&<div style={{textAlign:'center'}}>
        <div style={{fontSize:'14px',fontWeight:700,color:isCorrect?'#00b894':'#ff6363',marginBottom:'8px'}}>{isCorrect?'✓ Correct!':'✗ Not quite — degrees revealed above'}</div>
        {waitNext&&<button onClick={handleNext} style={{background:'#ffd93d',color:'#111',border:'none',padding:'11px 36px',borderRadius:'10px',fontSize:'14px',fontWeight:800,cursor:'pointer',minHeight:'44px'}}>Next →</button>}
      </div>}
    </div>
  );
}

function NameOpt({opt,picked,correctId,onPick}){
  const isSel=picked===opt,showFb=!!picked,isC=opt.id===correctId;
  return(<button onClick={()=>onPick(opt)} style={{background:!showFb?'#13121f':isC?'#00b89420':isSel?'#ff636320':'#13121f',border:`2px solid ${!showFb?'#2a2840':isC?'#00b894':isSel?'#ff6363':'#2a2840'}`,borderRadius:'10px',cursor:picked?'default':'pointer',padding:'10px 7px',transition:'border-color 0.2s',textAlign:'center',width:'100%',minHeight:'64px'}}>
    <div style={{fontSize:'19px',fontWeight:900,color:'#fff'}}>{opt.sym}</div>
    <div style={{fontSize:'10px',color:'#bbb',marginTop:'2px'}}>{opt.name}</div>
    <div style={{fontSize:'8px',color:CATS[opt.cat].color,marginTop:'1px',fontWeight:600}}>{CATS[opt.cat].label}</div>
    {showFb&&<div style={{fontSize:'13px',marginTop:'3px',color:isC?'#00b894':isSel?'#ff6363':'transparent'}}>{isC?'✓':isSel?'✗':' '}</div>}
  </button>);
}
function ShapeOpt({opt,picked,correctId,onPick,showDeg,hideLabel}){
  const isSel=picked===opt,showFb=!!picked,isC=opt.id===correctId;
  return(<button onClick={()=>onPick(opt)} style={{background:!showFb?'#13121f':isC?'#00b89420':isSel?'#ff636320':'#13121f',border:`2px solid ${!showFb?'#2a2840':isC?'#00b894':isSel?'#ff6363':'#2a2840'}`,borderRadius:'10px',cursor:picked?'default':'pointer',padding:'8px 5px',transition:'border-color 0.2s',display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
    <ChordDiagram v={opt.voicings[0]} showDeg={showDeg} size={0.88}/>
    {!hideLabel&&<div style={{fontSize:'8px',color:'#999',marginTop:'2px'}}>{opt.name}</div>}
    {showFb&&<div style={{fontSize:'13px',marginTop:'3px',color:isC?'#00b894':isSel?'#ff6363':'transparent'}}>{isC?'✓':isSel?'✗':' '}</div>}
  </button>);
}
const QL=10;
function makeQ(pool,mode){
  const c=pool[Math.floor(Math.random()*pool.length)];
  const qm=mode==='mixed'?(Math.random()<0.5?'n2s':'s2n'):mode;
  const same=shuffle(pool.filter(x=>x.id!==c.id&&x.cat===c.cat));
  const other=shuffle(pool.filter(x=>x.id!==c.id&&x.cat!==c.cat));
  return{chord:c,qm,opts:shuffle([c,...[...same,...other].slice(0,3)])};
}
function ChordQuiz({showDeg,onComplete,pool,onBack}){
  const allCatKeys=Object.keys(CATS);
  const[phase,setPhase]=useState('setup');
  const[mode,setMode]=useState('mixed');
  const[selCats,setSelCats]=useState(new Set(allCatKeys));
  const[qs,setQs]=useState([]);
  const[qi,setQi]=useState(0);
  const[ans,setAns]=useState([]);
  const[picked,setPicked]=useState(null);
  const filteredPool=useMemo(()=>{if(pool)return pool;const fp=CHORDS.filter(c=>selCats.has(c.cat));return fp.length>=4?fp:CHORDS;},[selCats,pool]);
  const toggleCat=k=>setSelCats(prev=>{const n=new Set(prev);if(n.has(k)){if(n.size>1)n.delete(k);}else n.add(k);return n;});
  const n=Math.min(QL,filteredPool.length);
  const start=()=>{const arr=[];const seen=new Set();for(let i=0;i<n*5&&arr.length<n;i++){const q=makeQ(filteredPool,mode);if(!seen.has(q.chord.id)){seen.add(q.chord.id);arr.push(q);}}setQs(arr);setQi(0);setAns([]);setPicked(null);setPhase('playing');};
  const pick=opt=>{if(picked)return;setPicked(opt);setTimeout(()=>{const correct=opt.id===qs[qi].chord.id;const na=[...ans,{id:qs[qi].chord.id,correct}];setAns(na);if(qi+1>=qs.length){onComplete&&onComplete(na);setPhase('done');}else{setQi(i=>i+1);setPicked(null);}},900);};
  const score=ans.filter(a=>a.correct).length;
  if(phase==='setup')return(
    <div style={{padding:'20px 14px',maxWidth:'460px',margin:'0 auto'}}>
      {onBack&&<button onClick={onBack} style={{display:'block',marginBottom:'12px',background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>← Back</button>}
      <div style={{textAlign:'center',marginBottom:'16px'}}><div style={{fontSize:'36px',marginBottom:'5px'}}>🎯</div><h2 style={{fontSize:'19px',fontWeight:900,margin:'0 0 2px',color:'#fff'}}>Chord Quiz</h2><p style={{color:'#aaa',margin:0,fontSize:'11px'}}>{pool?`Drilling ${filteredPool.length} weak chords`:`${n} questions · spaced repetition`}</p></div>
      <div style={{marginBottom:'12px'}}>
        <div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px'}}>Direction</div>
        <div style={{display:'flex',gap:'6px'}}>{[{id:'n2s',label:'Name→Shape'},{id:'s2n',label:'Shape→Name'},{id:'mixed',label:'⚡ Mixed'}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'9px 4px',borderRadius:'9px',cursor:'pointer',border:mode===m.id?'2px solid #ffd93d':'1px solid #2a2840',background:mode===m.id?'#1e1c32':'#13121f',color:mode===m.id?'#ffd93d':'#aaa',fontSize:'11px',fontWeight:700}}>{m.label}</button>))}</div>
      </div>
      {!pool&&(<div style={{marginBottom:'16px'}}>
        <div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px'}}>Chord types · {selCats.size}/{allCatKeys.length} selected</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{Object.entries(CATS).map(([k,c])=>{const on=selCats.has(k);const nc=CHORDS.filter(x=>x.cat===k).length;return(<button key={k} onClick={()=>toggleCat(k)} style={{padding:'4px 10px',borderRadius:'14px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:`1px solid ${on?c.color:c.color+'33'}`,background:on?c.color+'22':'transparent',color:on?c.color:'#666'}}>{c.label} ({nc})</button>);})}</div>
        <div style={{fontSize:'10px',color:'#666',marginTop:'4px'}}>{filteredPool.length} chords in pool</div>
      </div>)}
      <button onClick={start} style={{display:'block',width:'100%',background:'#ffd93d',color:'#111',border:'none',padding:'13px',borderRadius:'11px',fontSize:'14px',fontWeight:900,cursor:'pointer'}}>Start Quiz 🎸</button>
    </div>
  );
  if(phase==='done'){
    const pct=Math.round(score/qs.length*100);
    return(<div style={{padding:'24px 14px',maxWidth:'380px',margin:'0 auto',textAlign:'center'}}>
      <div style={{fontSize:'50px',marginBottom:'4px'}}>{pct===100?'🏆':pct>=80?'⭐':pct>=60?'🎸':'💪'}</div>
      <div style={{fontSize:'18px',fontWeight:800,marginBottom:'2px',color:'#fff'}}>{pct===100?'Flawless!':pct>=80?'Great!':pct>=60?'Keep going!':'More practice!'}</div>
      <div style={{fontSize:'54px',fontWeight:900,color:'#ffd93d',lineHeight:1,marginBottom:'2px'}}>{score}/{qs.length}</div>
      <div style={{color:'#aaa',marginBottom:'14px'}}>{pct}% correct</div>
      <div style={{display:'flex',gap:'4px',justifyContent:'center',flexWrap:'wrap',marginBottom:'16px'}}>{ans.map((a,i)=>(<div key={i} style={{width:'26px',height:'26px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,background:a.correct?'#00b89420':'#ff636320',border:`1px solid ${a.correct?'#00b894':'#ff6363'}`,color:a.correct?'#00b894':'#ff6363'}}>{a.correct?'✓':'✗'}</div>))}</div>
      <div style={{display:'flex',gap:'6px',justifyContent:'center'}}>
        {onBack&&<button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'8px 14px',borderRadius:'9px',fontSize:'12px',cursor:'pointer'}}>Back</button>}
        <button onClick={()=>setPhase('setup')} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'8px 14px',borderRadius:'9px',fontSize:'12px',cursor:'pointer'}}>Settings</button>
        <button onClick={start} style={{background:'#ffd93d',color:'#111',border:'none',padding:'8px 20px',borderRadius:'9px',fontSize:'13px',fontWeight:800,cursor:'pointer'}}>Again</button>
      </div>
    </div>);
  }
  const q=qs[qi];if(!q)return null;
  const isN2S=q.qm==='n2s';
  return(<div style={{padding:'12px',maxWidth:'540px',margin:'0 auto'}}>
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'#999',fontSize:'11px'}}>Q{qi+1}/{qs.length}</span><span style={{color:'#ffd93d',fontSize:'11px',fontWeight:700}}>{score} correct</span></div>
      <div style={{background:'#1a1928',borderRadius:'3px',height:'4px'}}><div style={{background:'linear-gradient(90deg,#ff6b6b,#ffd93d)',height:'4px',borderRadius:'3px',width:`${(qi/qs.length)*100}%`,transition:'width .3s'}}/></div>
      <span style={{fontSize:'9px',color:'#666',background:'#1a1928',padding:'1px 7px',borderRadius:'8px',marginTop:'4px',display:'inline-block'}}>{isN2S?'Name → Shape':'Shape → Name'}</span>
    </div>
    {isN2S?(<div>
      <div style={{textAlign:'center',marginBottom:'10px'}}><div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Find the shape for:</div><div style={{fontSize:'44px',fontWeight:900,color:'#ffd93d',lineHeight:1}}>{q.chord.sym}</div><div style={{fontSize:'11px',color:'#bbb',marginTop:'2px'}}>{q.chord.name}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>{q.opts.map(opt=><ShapeOpt key={opt.id} opt={opt} picked={picked} correctId={q.chord.id} onPick={pick} showDeg={showDeg} hideLabel={true}/>)}</div>
    </div>):(<div>
      <div style={{textAlign:'center',marginBottom:'10px'}}><div style={{fontSize:'10px',color:'#888',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Name this chord:</div><div style={{background:'#13121f',borderRadius:'12px',padding:'10px',display:'inline-block',border:'1px solid #2a2840'}}><ChordDiagram v={q.chord.voicings[0]} showDeg={showDeg} size={1.55}/></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>{q.opts.map(opt=><NameOpt key={opt.id} opt={opt} picked={picked} correctId={q.chord.id} onPick={pick}/>)}</div>
    </div>)}
  </div>);
}
function QuizTab({showDeg,onChordQuizDone,onDegDone}){
  const[mode,setMode]=useState('chord');
  return(<div>
    <div style={{display:'flex',gap:'0',margin:'8px 12px 0',background:'#13121f',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
      {[{id:'chord',label:'🎸 Chord Quiz'},{id:'degree',label:'🎼 Scale Degrees'}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:mode===m.id?'#2a2840':'transparent',color:mode===m.id?'#ffd93d':'#888',fontSize:'12px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>))}
    </div>
    {mode==='chord'&&<ChordQuiz showDeg={showDeg} onComplete={onChordQuizDone}/>}
    {mode==='degree'&&<ScaleDegreeQuiz onSaveDeg={onDegDone}/>}
  </div>);
}

const RN_OFFSETS={
  'I':0,'bII':1,'II':2,'bIII':3,'III':4,'IV':5,'bV':6,'V':7,'bVI':8,'VI':9,'bVII':10,'VII':11,
  'i':0,'bii':1,'ii':2,'biii':3,'iii':4,'iv':5,'bv':6,'v':7,'bvi':8,'vi':9,'bvii':10,'vii':11,
};
const Q_SUFFIX={
  'maj7':'maj7','m7':'m7','7':'7','maj':'','min':'m','m7b5':'m7b5',
  'dim7':'dim7','7b9':'7b9','9':'9','maj9':'maj9','m9':'m9',
  '6':'6','7sus4':'7sus4','m6':'m6',
};
const QTMPL={
  'maj7':{str:[-1,3,2,4,-1,-1],deg:[null,'R','3','7',null,null],sf:1},
  'm7':{str:[-1,3,1,3,-1,-1],deg:[null,'R','b3','b7',null,null],sf:1},
  '7':{str:[-1,3,2,3,-1,-1],deg:[null,'R','3','b7',null,null],sf:1},
  'maj':{str:[-1,3,5,5,5,3],deg:[null,'R','5','R','3','5'],sf:3},
  'min':{str:[-1,3,5,5,4,3],deg:[null,'R','5','R','b3','5'],sf:3},
  'm7b5':{str:[-1,3,4,3,-1,-1],deg:[null,'R','b5','b7',null,null],sf:3},
  'dim7':{str:[-1,3,4,2,4,-1],deg:[null,'R','b5','bb7','b3',null],sf:2},
  '7b9':{str:[-1,3,2,3,2,-1],deg:[null,'R','3','b7','b9',null],sf:2},
  '9':{str:[-1,3,2,3,3,-1],deg:[null,'R','3','b7','9',null],sf:1},
  'maj9':{str:[-1,3,2,4,3,-1],deg:[null,'R','3','7','9',null],sf:1},
  'm9':{str:[-1,3,1,3,3,-1],deg:[null,'R','b3','b7','9',null],sf:1},
  '7sus4':{str:[-1,3,3,3,-1,-1],deg:[null,'R','4','b7',null,null],sf:3},
  '6':{str:[-1,3,2,2,3,-1],deg:[null,'R','3','6','9',null],sf:2},
};
const TMPL_ROOT=0;
function transposeFromTemplate(tmpl,targetNote){
  const shift=((targetNote-TMPL_ROOT)+12)%12;
  if(shift===0)return{...tmpl,label:''};
  const newStr=tmpl.str.map(f=>f>0?f+shift:f);
  const active=newStr.filter(f=>f>0);
  return{...tmpl,str:newStr,sf:active.length>0?Math.min(...active):1,label:''};
}
function getChordName(keyNote,rnStr,quality){
  const offset=RN_OFFSETS[rnStr]||0;
  const noteIdx=(keyNote+offset+12)%12;
  const sfx=Q_SUFFIX[quality]!==undefined?Q_SUFFIX[quality]:quality;
  return NOTE_NAMES[noteIdx]+sfx;
}
function getVoicing(keyNote,rnStr,quality){
  const offset=RN_OFFSETS[rnStr]||0;
  const targetNote=(keyNote+offset+12)%12;
  const tmpl=QTMPL[quality];
  if(!tmpl)return null;
  return transposeFromTemplate(tmpl,targetNote);
}

const PROGS_RN=[
  {title:'ii–V–I',feel:'Jazz',desc:'The cornerstone of jazz. ii creates tension, V raises it, I resolves.',chords:[{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'I–VI–ii–V',feel:'Jazz',desc:'Classic turnaround moving through the relative minor and subdominant.',chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'iii–VI–ii–V',feel:'Jazz',desc:'Extended turnaround starting on the mediant. Common in AABA forms.',chords:[{rn:'iii',q:'m7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'I–IV–iii–VI–ii–V–I',feel:'Jazz',desc:'Long-form turnaround through the full diatonic cycle. Heard in standards like Misty.',chords:[{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'},{rn:'iii',q:'m7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'Minor ii–V–i',feel:'Jazz',desc:'Dark jazz minor cadence. Half-diminished creates tritone tension, altered dominant resolves.',chords:[{rn:'ii',q:'m7b5'},{rn:'V',q:'7b9'},{rn:'i',q:'m7'}]},
  {title:'Minor i–VI–ii–V',feel:'Jazz',desc:'Minor key turnaround. The bVI gives it its distinctively dark, cinematic quality.',chords:[{rn:'i',q:'m7'},{rn:'bVI',q:'maj7'},{rn:'ii',q:'m7b5'},{rn:'V',q:'7b9'}]},
  {title:'Backdoor ii–V',feel:'Jazz',desc:'bVII7 approaches I from below — the "backdoor" substitution for the standard V.',chords:[{rn:'I',q:'maj7'},{rn:'bVII',q:'7'},{rn:'IV',q:'maj7'},{rn:'I',q:'maj7'}]},
  {title:'Tritone Substitution',feel:'Jazz',desc:'bII7 replaces V7. The tritone relationship creates a smooth chromatic bass descent.',chords:[{rn:'ii',q:'m7'},{rn:'bII',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'I–II7–V–I',feel:'Jazz',desc:'Secondary dominant II7 briefly tonicises V before resolving.',chords:[{rn:'I',q:'maj7'},{rn:'II',q:'7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'}]},
  {title:'Coltrane Changes',feel:'Jazz',desc:'Three Imaj7 chords a major 3rd apart, each with its V7. A cycle that shook jazz harmony.',chords:[{rn:'I',q:'maj7'},{rn:'III',q:'7'},{rn:'bVI',q:'maj7'},{rn:'I',q:'7'},{rn:'IV',q:'maj7'},{rn:'bVI',q:'7'}]},
  {title:'Rhythm Changes · A section',feel:'Jazz',desc:"I–VI–ii–V in Bb — Gershwin's I Got Rhythm, backbone of bebop for 80+ years.",chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'Rhythm Changes · B section',feel:'Jazz',desc:'III7–VI7–II7–V7 — a chain of secondary dominants descending the circle of 5ths.',chords:[{rn:'III',q:'7'},{rn:'VI',q:'7'},{rn:'II',q:'7'},{rn:'V',q:'7'}]},
  {title:'Jazz Waltz · I–VI–ii–V',feel:'Jazz',desc:'Classic turnaround in 3/4. The lilting feel gives familiar harmony new life.',chords:[{rn:'I',q:'maj7'},{rn:'VI',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'So What / Modal Vamp',feel:'Jazz',desc:'i7 with a brief shift to bii7. Floating Dorian quality with no strong resolution.',chords:[{rn:'i',q:'m7'},{rn:'bii',q:'m7'}]},
  {title:'Dorian Vamp · i–IV',feel:'Jazz',desc:'Minor i7 to IV7. The major IV chord gives the Dorian mode its characteristic bright colour.',chords:[{rn:'i',q:'m7'},{rn:'IV',q:'7'}]},
  {title:'Autumn Leaves',feel:'Jazz',desc:'ii–V–I–IV descending through the cycle of 4ths. The most used standard template.',chords:[{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'}]},
  {title:'Misty · opening',feel:'Jazz',desc:'Imaj7–bIII7–ii–V. The unexpected bIII7 secondary dominant gives Misty its lush opening.',chords:[{rn:'I',q:'maj7'},{rn:'bIII',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'}]},
  {title:'12-Bar Blues',feel:'Blues',desc:'The foundation. I7–IV7–V7 pattern. Infinite expression.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'V',q:'7'}]},
  {title:'Quick Change Blues',feel:'Blues',desc:'Bar 2 jumps to IV7 then back to I7. Creates extra movement in the first four bars.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'I',q:'7'},{rn:'V',q:'7'}]},
  {title:'Minor Blues',feel:'Blues',desc:'The darker sibling. i7–iv7–V7b9 gives a melancholic, soulful quality.',chords:[{rn:'i',q:'m7'},{rn:'iv',q:'m7'},{rn:'V',q:'7b9'}]},
  {title:'Jazz Blues',feel:'Blues',desc:'Blues with jazz ii–V substitutions into IV. The Bird and Monk standard template.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'ii',q:'m7'},{rn:'V',q:'7'},{rn:'I',q:'7'},{rn:'bVII',q:'7'}]},
  {title:'8-Bar Blues',feel:'Blues',desc:'Compact form: I–V–IV–I. Common in country blues and early rock.',chords:[{rn:'I',q:'7'},{rn:'V',q:'7'},{rn:'IV',q:'7'},{rn:'I',q:'7'}]},
  {title:'I–V–vi–IV',feel:'Pop',desc:'The "axis" progression. Underlies hundreds of hit songs across every era of pop music.',chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'IV',q:'maj'}]},
  {title:'vi–IV–I–V',feel:'Pop',desc:'Axis starting on the relative minor. Same four chords, distinctly darker feel.',chords:[{rn:'vi',q:'min'},{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–IV–V',feel:'Folk/Country',desc:'Three chords, a million songs. The backbone of folk, country, and rock n roll.',chords:[{rn:'I',q:'maj'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–vi–IV–V',feel:'Pop',desc:'The "50s progression". Doo-wop, early rock and roll, and countless ballads.',chords:[{rn:'I',q:'maj'},{rn:'vi',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–V–vi–iii–IV',feel:'Pop',desc:'Extended pop loop. The iii minor adds unexpected depth before landing on IV.',chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'}]},
  {title:'I–iii–IV–V',feel:'Pop',desc:'The mediant iii creates a flowing, optimistic quality heard in soul and pop classics.',chords:[{rn:'I',q:'maj'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'I–ii–IV–V',feel:'Pop',desc:'The ii minor adds a jazzy stepping-stone between I and IV. Smooth and melodic.',chords:[{rn:'I',q:'maj'},{rn:'ii',q:'min'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'IV–I–V–vi',feel:'Pop',desc:'Axis starting on IV. Opens with an immediate uplifting, anthemic feel.',chords:[{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'}]},
  {title:'I–bVII–IV',feel:'Rock',desc:'Borrowing bVII from Mixolydian gives rock its raw, anthemic quality. Hendrix to Oasis.',chords:[{rn:'I',q:'maj'},{rn:'bVII',q:'maj'},{rn:'IV',q:'maj'}]},
  {title:'i–bVII–bVI–V',feel:'Rock',desc:'Natural minor descent. From Flamenco to metal to film scores — dark and inevitable.',chords:[{rn:'i',q:'min'},{rn:'bVII',q:'maj'},{rn:'bVI',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'i–bVI–bVII–i',feel:'Rock',desc:'Aeolian loop. The bVI and bVII create an open-ended modal quality widely used in rock.',chords:[{rn:'i',q:'min'},{rn:'bVI',q:'maj'},{rn:'bVII',q:'maj'},{rn:'i',q:'min'}]},
  {title:'I–bVI–bVII–I',feel:'Rock',desc:'Borrowed from parallel minor in a major key. Dramatic and cinematic.',chords:[{rn:'I',q:'maj'},{rn:'bVI',q:'maj'},{rn:'bVII',q:'maj'},{rn:'I',q:'maj'}]},
  {title:'I–III7–IV–iv',feel:'Neo-Soul/R&B',desc:'The chromatic III7→iv colour shift is the neo-soul signature. Rich and sophisticated.',chords:[{rn:'I',q:'maj7'},{rn:'III',q:'7'},{rn:'IV',q:'maj7'},{rn:'iv',q:'m7'}]},
  {title:'I–IV–iii–vi',feel:'R&B/Soul',desc:'Stepping down from IV through iii to vi creates warmth and forward motion.',chords:[{rn:'I',q:'maj7'},{rn:'IV',q:'maj7'},{rn:'iii',q:'m7'},{rn:'vi',q:'m7'}]},
  {title:'ii–IV–I',feel:'R&B/Soul',desc:'Bypasses V entirely. Moving ii→IV→I feels lush and inevitable.',chords:[{rn:'ii',q:'m7'},{rn:'IV',q:'maj7'},{rn:'I',q:'maj7'}]},
  {title:'i–bIII–bVII–IV',feel:'Neo-Soul',desc:'Minor with borrowed major chords. Sophisticated, emotionally complex loop.',chords:[{rn:'i',q:'m7'},{rn:'bIII',q:'maj7'},{rn:'bVII',q:'7'},{rn:'IV',q:'maj7'}]},
  {title:'I–bIII–IV',feel:'Funk/Soul',desc:'Parallel minor bIII gives funk and soul its gritty edge. Direct and powerful.',chords:[{rn:'I',q:'7'},{rn:'bIII',q:'7'},{rn:'IV',q:'7'}]},
  {title:'I–IV Plagal Cadence',feel:'Gospel',desc:'The "Amen" movement. Foundational to gospel, blues, and spirituals.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'}]},
  {title:'I7–IV7–V7',feel:'Gospel',desc:'The gospel shuffle. Dominant 7ths throughout give it raw, soulful energy.',chords:[{rn:'I',q:'7'},{rn:'IV',q:'7'},{rn:'V',q:'7'}]},
  {title:'I–I7–IV–iv',feel:'Gospel',desc:'Moving I→I7 tonicises IV, then iv minor adds bluesy colour before returning home.',chords:[{rn:'I',q:'maj'},{rn:'I',q:'7'},{rn:'IV',q:'maj'},{rn:'iv',q:'min'}]},
  {title:'Bossa Nova · I–vi–ii–V',feel:'Bossa Nova',desc:'The classic bossa loop. Smooth voice leading, gentle movement, Brazilian jazz.',chords:[{rn:'I',q:'maj7'},{rn:'vi',q:'m7'},{rn:'ii',q:'m7'},{rn:'V',q:'7sus4'}]},
  {title:'Samba · I–vi–ii–V',feel:'Samba',desc:'Same cycle as bossa but with a driving samba feel. Celebratory and energetic.',chords:[{rn:'I',q:'maj'},{rn:'vi',q:'min'},{rn:'ii',q:'min'},{rn:'V',q:'7'}]},
  {title:'Flamenco Cadence',feel:'Flamenco',desc:'i–bVII–bVI–V. Ancient Phrygian descent. Dramatic, cinematic, and deeply emotional.',chords:[{rn:'i',q:'min'},{rn:'bVII',q:'maj'},{rn:'bVI',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'Tango · i–V',feel:'Tango',desc:'Minor-to-dominant oscillation gives tango its tense, seductive quality.',chords:[{rn:'i',q:'min'},{rn:'V',q:'7'}]},
  {title:'i–iv–V–i',feel:'Classical',desc:'Harmonic minor cadence. The raised 7th in V creates its characteristic pull to tonic.',chords:[{rn:'i',q:'min'},{rn:'iv',q:'min'},{rn:'V',q:'7'},{rn:'i',q:'min'}]},
  {title:'Pachelbel Canon',feel:'Classical',desc:"I–V–vi–iii–IV–I–IV–V. One of history's most reused progressions — timeless.",chords:[{rn:'I',q:'maj'},{rn:'V',q:'maj'},{rn:'vi',q:'min'},{rn:'iii',q:'min'},{rn:'IV',q:'maj'},{rn:'I',q:'maj'},{rn:'IV',q:'maj'},{rn:'V',q:'maj'}]},
  {title:'Perfect Cadence · V–I',feel:'Classical',desc:'V creates maximum harmonic tension; I resolves it. The most fundamental move in Western music.',chords:[{rn:'V',q:'7'},{rn:'I',q:'maj'}]},
  {title:'Deceptive Cadence · V–vi',feel:'Classical',desc:'V resolves to vi instead of I, surprising the listener. Creates forward momentum.',chords:[{rn:'V',q:'7'},{rn:'vi',q:'min'}]},
  {title:'Neapolitan · bII–V–I',feel:'Classical',desc:'The Neapolitan chord (bII major) adds a dramatic Romantic-era colour before V–I.',chords:[{rn:'bII',q:'maj'},{rn:'V',q:'7'},{rn:'I',q:'maj'}]},
];

function ProgressionsTab({showDeg}){
  const[keyNote,setKeyNote]=useState(0);
  const[broadCat,setBroadCat]=useState('all');
  const[search,setSearch]=useState('');
  const[sel,setSel]=useState(null);
  const list=useMemo(()=>{
    let r=broadCat==='all'?PROGS_RN:PROGS_RN.filter(p=>(FEEL_TO_CAT[p.feel]||'Jazz')===broadCat);
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.feel.toLowerCase().includes(q)||p.chords.some(c=>c.rn.toLowerCase().includes(q)));}
    return r;
  },[broadCat,search]);
  const prog=sel!=null?PROGS_RN[sel]:null;
  const getProgVoicings=useCallback(p=>p.chords.map(c=>({...c,name:getChordName(keyNote,c.rn,c.q),voicing:getVoicing(keyNote,c.rn,c.q)})),[keyNote]);

  if(prog){
    const slots=getProgVoicings(prog);
    const bc=BROAD_CATS.find(b=>b.id===(FEEL_TO_CAT[prog.feel]||'Jazz'));
    return(
      <div style={{padding:'14px',maxWidth:'600px',margin:'0 auto'}}>
        <button onClick={()=>setSel(null)} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',marginBottom:'12px',fontSize:'12px'}}>← Back</button>
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',marginBottom:'3px'}}>
            <div style={{fontSize:'20px',fontWeight:900,color:'#fff'}}>{prog.title}</div>
            {bc&&<span style={{fontSize:'9px',background:bc.color+'22',color:bc.color,padding:'2px 8px',borderRadius:'5px',fontWeight:700}}>{bc.emoji} {prog.feel}</span>}
          </div>
          <div style={{fontSize:'12px',color:'#bbb',lineHeight:'1.5',marginBottom:'8px'}}>{prog.desc}</div>
          <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
            {prog.chords.map((c,i)=>(
              <span key={i} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                <span style={{background:'#1a1928',border:'1px solid #2a2840',borderRadius:'6px',padding:'3px 8px',fontSize:'12px',color:'#fff',fontWeight:700}}>{c.rn}<span style={{color:'#ffd93d',fontSize:'10px',marginLeft:'2px'}}>{Q_SUFFIX[c.q]||c.q}</span></span>
                {i<prog.chords.length-1&&<span style={{color:'#333',fontSize:'11px'}}>→</span>}
              </span>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'14px',background:'#13121f',borderRadius:'9px',padding:'8px 10px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'6px'}}>Key: <span style={{color:'#ffd93d'}}>{NOTE_NAMES[keyNote]}</span></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
            {NOTE_NAMES.map((n,i)=>(
              <button key={i} onClick={()=>setKeyNote(i)} style={{padding:'4px 8px',borderRadius:'7px',cursor:'pointer',fontSize:'12px',fontWeight:700,border:`1px solid ${i===keyNote?'#ffd93d':'#2a2840'}`,background:i===keyNote?'#ffd93d22':'transparent',color:i===keyNote?'#ffd93d':'#777',transition:'all .15s',minHeight:'30px'}}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginBottom:'14px'}}>
          {slots.map((s,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{background:'#13121f',borderRadius:'10px',padding:'10px 8px 8px',border:'1px solid #2a2840',minWidth:'88px',textAlign:'center'}}>
                {s.voicing?(<>
                  <ChordDiagram v={s.voicing} showDeg={showDeg} size={0.95}/>
                  <div style={{fontSize:'13px',fontWeight:900,color:'#fff',marginTop:'3px'}}>{s.name}</div>
                  <div style={{fontSize:'10px',color:'#ffd93d',marginTop:'1px',marginBottom:'5px',fontWeight:700}}>{s.rn}</div>
                  <PlayButtons v={s.voicing} size="sm" stack/>
                </>):(
                  <div style={{padding:'20px 8px',color:'#555',fontSize:'11px'}}>{s.name}<br/><span style={{fontSize:'9px'}}>no voicing</span></div>
                )}
              </div>
              {i<slots.length-1&&<div style={{color:'#333',fontSize:'16px',marginTop:'6px'}}>→</div>}
            </div>
          ))}
        </div>
        <div style={{background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'8px'}}>Function in key of {NOTE_NAMES[keyNote]}</div>
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
            {slots.map((s,i)=>(
              <div key={i} style={{background:'#0f0e17',borderRadius:'7px',padding:'6px 10px',border:'1px solid #2a2840',textAlign:'center',minWidth:'56px'}}>
                <div style={{fontSize:'12px',fontWeight:900,color:'#ffd93d'}}>{s.rn}</div>
                <div style={{fontSize:'11px',color:'#fff',marginTop:'1px',fontWeight:700}}>{s.name}</div>
                <div style={{fontSize:'9px',color:'#666',marginTop:'1px'}}>{s.q}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:'14px',maxWidth:'600px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'16px',fontWeight:900,color:'#fff',marginBottom:'2px'}}>Progressions</div>
        <div style={{fontSize:'11px',color:'#999'}}>{PROGS_RN.length} progressions · all styles · transpose to any key</div>
      </div>
      <div style={{background:'#13121f',borderRadius:'9px',padding:'8px 10px',border:'1px solid #2a2840',marginBottom:'10px'}}>
        <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'5px'}}>Key: <span style={{color:'#ffd93d',fontWeight:700}}>{NOTE_NAMES[keyNote]}</span></div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'3px'}}>
          {NOTE_NAMES.map((n,i)=>(
            <button key={i} onClick={()=>setKeyNote(i)} style={{padding:'4px 7px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`1px solid ${i===keyNote?'#ffd93d':'#2a2840'}`,background:i===keyNote?'#ffd93d22':'transparent',color:i===keyNote?'#ffd93d':'#666',transition:'all .15s',minHeight:'28px'}}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{position:'relative',marginBottom:'10px'}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search progressions…"
          style={{width:'100%',background:'#13121f',border:'1px solid #2a2840',borderRadius:'9px',padding:'8px 32px 8px 12px',color:'#fff',fontSize:'13px',boxSizing:'border-box',outline:'none'}}/>
        {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',color:'#666',fontSize:'18px',cursor:'pointer',padding:'0',lineHeight:'1'}}>×</button>}
      </div>
      {!search&&(
        <div style={{display:'flex',gap:'5px',marginBottom:'10px',flexWrap:'wrap'}}>
          <button onClick={()=>setBroadCat('all')} style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:'none',background:broadCat==='all'?'#a29bfe':'#1a1928',color:broadCat==='all'?'#111':'#aaa',transition:'all .15s'}}>All ({PROGS_RN.length})</button>
          {BROAD_CATS.map(bc=>{const n=PROGS_RN.filter(p=>(FEEL_TO_CAT[p.feel]||'Jazz')===bc.id).length;const on=broadCat===bc.id;return(<button key={bc.id} onClick={()=>setBroadCat(bc.id)} style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`1px solid ${on?bc.color:bc.color+'33'}`,background:on?bc.color+'22':'#1a1928',color:on?bc.color:'#aaa',transition:'all .15s'}}>{bc.emoji} {bc.label} <span style={{opacity:0.7}}>({n})</span></button>);})}
        </div>
      )}
      {search&&<div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>{list.length} result{list.length!==1?'s':''}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {list.map(p=>{
          const idx=PROGS_RN.indexOf(p);
          const chordNames=p.chords.map(c=>getChordName(keyNote,c.rn,c.q));
          const bc=BROAD_CATS.find(b=>b.id===(FEEL_TO_CAT[p.feel]||'Jazz'));
          return(
            <div key={idx} onClick={()=>setSel(idx)}
              style={{background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840',cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#a29bfe';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a2840';e.currentTarget.style.transform='none';}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'#fff',marginBottom:'4px'}}>{p.title}</div>
                  <div style={{display:'flex',gap:'3px',flexWrap:'wrap',alignItems:'center',marginBottom:'4px'}}>
                    {p.chords.map((c,ci)=>(
                      <span key={ci} style={{display:'flex',alignItems:'center',gap:'2px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:'#ffd93d',background:'#ffd93d11',padding:'1px 6px',borderRadius:'4px',fontFamily:'monospace'}}>{c.rn}<span style={{fontSize:'9px',opacity:0.8}}>{Q_SUFFIX[c.q]||c.q}</span></span>
                        {ci<p.chords.length-1&&<span style={{color:'#2a2840',fontSize:'10px'}}>›</span>}
                      </span>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'3px',flexWrap:'wrap',alignItems:'center'}}>
                    {chordNames.map((n,ci)=>(
                      <span key={ci} style={{display:'flex',alignItems:'center',gap:'2px'}}>
                        <span style={{fontSize:'10px',color:'#888',padding:'1px 5px',background:'#1a1928',borderRadius:'4px'}}>{n}</span>
                        {ci<chordNames.length-1&&<span style={{color:'#2a2840',fontSize:'10px'}}>›</span>}
                      </span>
                    ))}
                  </div>
                </div>
                {bc&&<span style={{fontSize:'9px',background:bc.color+'22',color:bc.color,padding:'2px 7px',borderRadius:'5px',fontWeight:700,whiteSpace:'nowrap',marginTop:'2px',flexShrink:0}}>{bc.emoji} {p.feel}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── CHORD DETAIL ─────────────────────────────────────────────────────────
// Standalone detail view — shared by Library and ChordsOfDay.
// Automatically enables Scale Degrees while open and restores prior state.
function ChordDetail({chord,onBack,showDeg,setShowDeg}){
  const[transRoot,setTransRoot]=useState(null);

  // Auto-enable degrees on open, restore on close
  useEffect(()=>{
    const prev=showDeg;
    setShowDeg(true);
    return()=>setShowDeg(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  if(!chord)return null;
  const ci=CATS[chord.cat];
  const currentRoot=getRootNote(chord.voicings[0]);
  const canTranspose=chord.movable&&currentRoot!==null&&chord.voicings[0].deg.some((d,i)=>d==='R'&&chord.voicings[0].str[i]>0);
  const displayVoicings=transRoot===null?chord.voicings:chord.voicings.map(v=>transposeVoicing(v,transRoot));
  const uniqueDegs=[...new Set(displayVoicings[0].deg?.filter(Boolean)||[])];

  return(
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={onBack} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'5px 14px',borderRadius:'8px',cursor:'pointer',marginBottom:'12px',fontSize:'12px',touchAction:'manipulation'}}>← Back</button>
      <div style={{textAlign:'center',marginBottom:'14px'}}>
        <span style={{fontSize:'10px',color:ci.color,fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',background:ci.color+'18',padding:'3px 10px',borderRadius:'20px'}}>{ci.label}</span>
        <div style={{fontSize:'24px',fontWeight:900,margin:'8px 0 2px',color:'#fff'}}>{chord.name}</div>
        <div style={{fontSize:'13px',color:'#aaa',fontStyle:'italic'}}>{chord.sym}</div>
      </div>
      {canTranspose&&(()=>{
        const validRoots=getValidTransposeRoots(chord.voicings[0]);
        return(
          <div style={{marginBottom:'14px',background:'#13121f',borderRadius:'10px',padding:'10px 12px',border:'1px solid #2a2840'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
              <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',letterSpacing:'2px'}}>Transpose root</div>
              {transRoot!==null&&<button onClick={()=>setTransRoot(null)} style={{fontSize:'10px',color:'#aaa',background:'transparent',border:'1px solid #2a2840',borderRadius:'6px',padding:'2px 8px',cursor:'pointer',touchAction:'manipulation'}}>Reset</button>}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
              {NOTE_NAMES.map((n,i)=>{
                const isActive=transRoot===null?i===currentRoot:i===transRoot;
                const isOriginal=i===currentRoot;
                const canUse=validRoots.has(i);
                return(
                  <button key={i} onClick={()=>canUse&&setTransRoot(i===currentRoot?null:i)} disabled={!canUse}
                    style={{padding:'5px 8px',borderRadius:'7px',cursor:canUse?'pointer':'not-allowed',fontSize:'12px',fontWeight:700,
                      border:`1px solid ${isActive?'#ffd93d':canUse?'#2a2840':'#1a1928'}`,
                      background:isActive?'#ffd93d22':canUse?'transparent':'transparent',
                      color:isActive?'#ffd93d':canUse?'#888':'#333',
                      transition:'all .15s',minHeight:'32px',
                      textDecoration:!canUse?'line-through':'none',opacity:!canUse?0.35:1,
                      touchAction:'manipulation'}}>
                    {n}{isOriginal&&transRoot!==null?'*':''}
                  </button>
                );
              })}
            </div>
            {transRoot!==null&&<div style={{fontSize:'11px',color:'#ffd93d',marginTop:'6px'}}>Showing {NOTE_NAMES[transRoot]} · fret {displayVoicings[0].sf} &nbsp;<span style={{color:'#666',fontSize:'10px'}}>* = original root ({NOTE_NAMES[currentRoot]})</span></div>}
            {transRoot===null&&<div style={{fontSize:'10px',color:'#555',marginTop:'5px'}}>Greyed notes cannot be played in this shape</div>}
          </div>
        );
      })()}
      <div style={{display:'flex',flexWrap:'wrap',gap:'16px',justifyContent:'center',marginBottom:'14px'}}>
        {displayVoicings.map((v,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
            <div style={{background:'#13121f',borderRadius:'12px',padding:'16px',border:`2px solid ${ci.color}44`}}><ChordDiagram v={v} showDeg={true} size={1.85}/></div>
            <div style={{fontSize:'10px',color:'#888',maxWidth:'160px',textAlign:'center'}}>{v.label}</div>
            <PlayButtons v={v}/>
          </div>
        ))}
      </div>
      {uniqueDegs.length>0&&(
        <div style={{padding:'10px 12px',background:'#13121f',borderRadius:'10px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'10px',color:'#888',marginBottom:'8px',letterSpacing:'2px',textTransform:'uppercase'}}>Scale degree guide</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'10px'}}>
            {uniqueDegs.map(d=>(
              <span key={d} style={{background:DC[d]+'22',color:DC[d],padding:'3px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:700,border:`1px solid ${DC[d]}44`}}>{d}</span>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
            {uniqueDegs.map(d=>(
              <div key={d} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',background:'#0f0e17',borderRadius:'7px',border:`1px solid ${DC[d]}33`}}>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:DC[d],flexShrink:0}}/>
                <span style={{fontSize:'12px',fontWeight:700,color:DC[d],minWidth:'28px'}}>{d}</span>
                <span style={{fontSize:'11px',color:'#888',lineHeight:'1.3'}}>{DEG_HINT[d]||''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Library({showDeg,setShowDeg}){
  const[cat,setCat]=useState('all');
  const[sel,setSel]=useState(null);
  const[transRoot,setTransRoot]=useState(null);
  const[filterOpen,setFilterOpen]=useState(true);
  const[filterMode,setFilterMode]=useState('family');
  // Family filter
  const[family,setFamily]=useState(null);
  // Builder filter
  const[bTriad,setBTriad]=useState(null);
  const[bSeventh,setBSeventh]=useState(null);
  const[bExts,setBExts]=useState(new Set());

  const toggleExt=id=>setBExts(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});
  const clearFilters=()=>{setFamily(null);setBTriad(null);setBSeventh(null);setBExts(new Set());setCat('all');};

  const activeFamilyCount=(family?1:0)+(cat!=='all'?1:0);
  const activeBuilderCount=(bTriad?1:0)+(bSeventh?1:0)+bExts.size+(cat!=='all'?1:0);
  const activeFilterCount=filterMode==='family'?activeFamilyCount:activeBuilderCount;

  const builderCombo=useMemo(()=>{
    if(!bTriad&&!bSeventh)return null;
    return BUILDER_COMBO[`${bTriad||'?'}|${bSeventh||'?'}`]||null;
  },[bTriad,bSeventh]);

  const list=useMemo(()=>{
    let r=cat==='all'?CHORDS:CHORDS.filter(c=>c.cat===cat);
    if(filterMode==='family'&&family){
      r=r.filter(chord=>{
        const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
        return FAMILY_TESTS[family]&&FAMILY_TESTS[family](degs);
      });
    }else if(filterMode==='builder'){
      r=r.filter(chord=>{
        const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
        if(bTriad&&!(TRIAD_TESTS[bTriad]&&TRIAD_TESTS[bTriad](degs)))return false;
        if(bSeventh&&!(SEVENTH_TESTS[bSeventh]&&SEVENTH_TESTS[bSeventh](degs)))return false;
        if(bExts.size>0){const ok=[...bExts].some(e=>EXT_TESTS[e]&&EXT_TESTS[e](degs));if(!ok)return false;}
        return true;
      });
    }
    return r;
  },[cat,filterMode,family,bTriad,bSeventh,bExts]);

  const chord=sel?CHORDS.find(c=>c.id===sel):null;
  const handleSel=id=>{setSel(id);setTransRoot(null);};

  if(chord){
    return <ChordDetail chord={chord} onBack={()=>{setSel(null);setTransRoot(null);}} showDeg={showDeg} setShowDeg={setShowDeg}/>;
  }

  // ── Helper: chord type strip (shared by both filter modes)
  const CatStrip=()=>(
    <div>
      <div style={{fontSize:'9px',color:'#555',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px',fontWeight:700}}>Chord Type</div>
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
        <button onClick={()=>setCat('all')} style={{padding:'5px 10px',borderRadius:'20px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:'none',background:cat==='all'?'#ffd93d':'#0f0e17',color:cat==='all'?'#111':'#777',transition:'all .15s'}}>All</button>
        {Object.entries(CATS).map(([k,c])=>{const n=CHORDS.filter(x=>x.cat===k).length;const on=cat===k;return(
          <button key={k} onClick={()=>setCat(on?'all':k)} style={{padding:'5px 10px',borderRadius:'20px',cursor:'pointer',fontSize:'10px',fontWeight:700,border:`1px solid ${on?c.color:c.color+'33'}`,background:on?c.color+'22':'#0f0e17',color:on?c.color:'#666',transition:'all .15s'}}>
            {c.label} <span style={{opacity:0.7}}>({n})</span>
          </button>
        );})}</div>
    </div>
  );

  return(
    <div style={{padding:'12px',maxWidth:'760px',margin:'0 auto'}}>

      {/* ── FILTER PANEL ──────────────────────────────────────────── */}
      <div style={{background:'#13121f',borderRadius:'13px',border:`1px solid ${activeFilterCount>0?'#a29bfe66':'#2a2840'}`,marginBottom:'10px',overflow:'hidden',transition:'border-color .2s'}}>

        {/* Header */}
        <div onClick={()=>setFilterOpen(p=>!p)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',cursor:'pointer',userSelect:'none'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'14px'}}>🎛</span>
            <span style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Filter Chords</span>
            {activeFilterCount>0&&<span style={{background:'#a29bfe',color:'#111',borderRadius:'10px',padding:'1px 8px',fontSize:'10px',fontWeight:900}}>{activeFilterCount} active</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {activeFilterCount>0&&<button onClick={e=>{e.stopPropagation();clearFilters();}} style={{background:'transparent',border:'1px solid #2a2840',color:'#aaa',padding:'3px 10px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:600}}>Clear all</button>}
            <span style={{color:'#555',fontSize:'12px',transition:'transform .2s',display:'inline-block',transform:filterOpen?'rotate(180deg)':'none'}}>▾</span>
          </div>
        </div>

        {/* Collapsed summary chips */}
        {activeFilterCount>0&&!filterOpen&&(
          <div style={{padding:'0 12px 10px',display:'flex',flexWrap:'wrap',gap:'4px',alignItems:'center'}}>
            {cat!=='all'&&<span style={{background:CATS[cat].color+'22',color:CATS[cat].color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${CATS[cat].color}44`}}>{CATS[cat].label}</span>}
            {filterMode==='family'&&family&&(()=>{const f=FAMILIES.find(x=>x.id===family);return f&&<span style={{background:f.color+'22',color:f.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${f.color}44`}}>{f.sym} {f.label}</span>;})()}
            {filterMode==='builder'&&<>
              {bTriad&&(()=>{const t=TRIADS.find(x=>x.id===bTriad);return t&&<span style={{background:t.color+'22',color:t.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${t.color}44`}}>{t.sym} {t.label}</span>;})()}
              {bSeventh&&(()=>{const s=SEVENTHS.find(x=>x.id===bSeventh);return s&&<span style={{background:s.color+'22',color:s.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${s.color}44`}}>{s.sym} {s.label}</span>;})()}
              {[...bExts].map(e=>{const ex=EXTS.find(x=>x.id===e);return ex&&<span key={e} style={{background:ex.color+'22',color:ex.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${ex.color}44`}}>{ex.sym}</span>;})}
              {builderCombo&&<span style={{background:builderCombo.color+'22',color:builderCombo.color,padding:'2px 9px',borderRadius:'10px',fontSize:'10px',fontWeight:700,border:`1px solid ${builderCombo.color}44`}}>= {builderCombo.label}</span>}
            </>}
            <span style={{color:'#555',fontSize:'10px',marginLeft:'2px'}}>→ {list.length} chord{list.length!==1?'s':''}</span>
          </div>
        )}

        {/* Expanded panel */}
        {filterOpen&&(
          <div style={{padding:'0 12px 14px',display:'flex',flexDirection:'column',gap:'12px'}}>

            <CatStrip/>

            {/* Mode tab switcher */}
            <div style={{display:'flex',gap:'0',background:'#0f0e17',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
              {[{id:'family',label:'🎯 Family'},{id:'builder',label:'🔧 Builder'}].map(m=>(
                <button key={m.id} onClick={()=>setFilterMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:filterMode===m.id?'#1e1c32':'transparent',color:filterMode===m.id?'#ffd93d':'#666',fontSize:'12px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>
              ))}
            </div>

            {/* ── FAMILY MODE ────────────────────────────────────────── */}
            {filterMode==='family'&&(
              <div>
                <div style={{fontSize:'9px',color:'#555',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'8px',fontWeight:700}}>Select a family — each is musically distinct</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                  {FAMILIES.map(f=>{
                    const matchCount=CHORDS.filter(chord=>{
                      const degs=new Set((chord.voicings[0].deg||[]).filter(Boolean));
                      return FAMILY_TESTS[f.id]&&FAMILY_TESTS[f.id](degs);
                    }).length;
                    const on=family===f.id;
                    return(
                      <button key={f.id} onClick={()=>setFamily(on?null:f.id)}
                        style={{background:on?f.color+'22':'#0f0e17',border:`1.5px solid ${on?f.color:f.color+'33'}`,borderRadius:'11px',cursor:'pointer',padding:'10px 12px',textAlign:'left',transition:'all .18s',boxShadow:on?`0 0 14px ${f.color}33`:'none',transform:on?'translateY(-1px)':'none'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                          <span style={{fontSize:f.sym.length>1?'14px':'22px',fontWeight:900,color:on?f.color:'#444',letterSpacing:'-1px',lineHeight:1}}>{f.sym}</span>
                          <span style={{fontSize:'9px',background:on?f.color+'33':'#1a1928',color:on?f.color:'#555',padding:'2px 6px',borderRadius:'8px',fontWeight:700}}>{matchCount}</span>
                        </div>
                        <div style={{fontSize:'12px',fontWeight:700,color:on?f.color:'#999'}}>{f.label}</div>
                        <div style={{fontSize:'9px',color:on?f.color+'99':'#555',marginTop:'2px',lineHeight:1.3}}>{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── BUILDER MODE ───────────────────────────────────────── */}
            {filterMode==='builder'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

                {/* Step 1 — Triad Base */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:'#ffd93d',color:'#111',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0}}>1</span>
                    <span style={{fontSize:'10px',color:'#bbb',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>Triad Base</span>
                    <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'8px',background:'#ffd93d18',border:'1px solid #ffd93d33',color:'#ffd93d',fontSize:'9px',fontWeight:700}}>required · pick one</span>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                    {TRIADS.map(t=>{
                      const on=bTriad===t.id;
                      const isText=t.sym.length>1;
                      return(
                        <button key={t.id} onClick={()=>setBTriad(on?null:t.id)}
                          style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 10px',borderRadius:'10px',cursor:'pointer',
                            border:`1.5px solid ${on?t.color:t.color+'33'}`,background:on?t.color+'22':'#0f0e17',
                            transition:'all .18s',boxShadow:on?`0 0 10px ${t.color}44`:'none',transform:on?'translateY(-1px)':'none',minWidth:'56px'}}>
                          <span style={{fontSize:isText?'12px':'18px',fontWeight:900,color:on?t.color:'#555',lineHeight:1,letterSpacing:isText?'0':'-0.5px'}}>{t.sym}</span>
                          <span style={{fontSize:'10px',color:on?t.color:'#777',marginTop:'3px',fontWeight:600}}>{t.label}</span>
                          <span style={{fontSize:'8px',color:on?t.color+'88':'#444',marginTop:'1px'}}>{t.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 — Seventh */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:bTriad?'#a29bfe':'#2a2840',color:bTriad?'#111':'#555',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0,transition:'all .2s'}}>2</span>
                    <span style={{fontSize:'10px',color:bTriad?'#bbb':'#555',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',transition:'color .2s'}}>Add a 7th</span>
                    <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'8px',background:'#2a2840',border:'1px dashed #3a3855',color:'#666',fontSize:'9px',fontWeight:700}}>optional · skip for plain triad</span>
                  </div>
                  {/* Live combination label */}
                  {builderCombo&&(
                    <div style={{marginBottom:'8px',display:'inline-flex',alignItems:'center',gap:'5px',padding:'4px 10px',borderRadius:'8px',background:builderCombo.color+'18',border:`1px solid ${builderCombo.color}44`}}>
                      <span style={{fontSize:'10px',fontWeight:700,color:builderCombo.color}}>= {builderCombo.label}</span>
                    </div>
                  )}
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap',opacity:bTriad?1:0.4,transition:'opacity .2s',pointerEvents:bTriad?'auto':'none'}}>
                    {SEVENTHS.map(s=>{
                      const on=bSeventh===s.id;
                      return(
                        <button key={s.id} onClick={()=>setBSeventh(on?null:s.id)}
                          style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 16px',borderRadius:'10px',cursor:'pointer',
                            border:`1.5px solid ${on?s.color:s.color+'33'}`,background:on?s.color+'22':'#0f0e17',
                            transition:'all .18s',boxShadow:on?`0 0 10px ${s.color}44`:'none',transform:on?'translateY(-1px)':'none',minWidth:'74px'}}>
                          <span style={{fontSize:'16px',fontWeight:900,color:on?s.color:'#555'}}>{s.sym}</span>
                          <span style={{fontSize:'10px',color:on?s.color:'#777',marginTop:'3px',fontWeight:600}}>{s.label}</span>
                          <span style={{fontSize:'8px',color:on?s.color+'88':'#444',marginTop:'1px'}}>{s.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3 — Extensions */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}>
                    <span style={{background:(bTriad||bSeventh)?'#a29bfe':'#2a2840',color:(bTriad||bSeventh)?'#111':'#555',width:'19px',height:'19px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,flexShrink:0,transition:'all .2s'}}>3</span>
                    <span style={{fontSize:'10px',color:(bTriad||bSeventh)?'#bbb':'#555',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',transition:'color .2s'}}>Color Tones</span>
                    <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'8px',background:'#2a2840',border:'1px dashed #3a3855',color:'#666',fontSize:'9px',fontWeight:700}}>
                      <span style={{fontSize:'10px'}}>☑</span> optional · pick any combo
                    </span>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap',opacity:(bTriad||bSeventh)?1:0.4,transition:'opacity .2s'}}>
                    {EXTS.map(e=>{
                      const on=bExts.has(e.id);
                      return(
                        <button key={e.id} onClick={()=>toggleExt(e.id)}
                          style={{padding:'6px 12px',borderRadius:'20px',cursor:'pointer',
                            border:`1.5px solid ${on?e.color:e.color+'44'}`,background:on?e.color+'28':'#0f0e17',
                            color:on?e.color:'#777',fontSize:'12px',fontWeight:700,
                            transition:'all .18s',boxShadow:on?`0 0 8px ${e.color}44`:'none',
                            display:'flex',alignItems:'center',gap:'4px'}}>
                          {on&&<span style={{fontSize:'9px'}}>✓</span>}{e.sym}
                        </button>
                      );
                    })}
                  </div>
                  {bExts.size>0&&<div style={{marginTop:'6px',fontSize:'9px',color:'#555'}}>tap again to deselect · {bExts.size} selected</div>}
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* ── RESULTS ───────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
        <div style={{fontSize:'11px',color:'#666'}}>
          {activeFilterCount>0
            ?<><span style={{color:'#a29bfe',fontWeight:700}}>{list.length}</span> chord{list.length!==1?'s':''} match</>
            :<><span style={{color:'#777',fontWeight:600}}>{list.length}</span> chords</>
          }
        </div>
        {activeFilterCount>0&&list.length===0&&<button onClick={clearFilters} style={{background:'transparent',border:'none',color:'#a29bfe',fontSize:'11px',cursor:'pointer',fontWeight:600}}>Clear filters</button>}
      </div>

      {list.length===0?(
        <div style={{textAlign:'center',padding:'40px 20px',color:'#888'}}>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>🎸</div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#ccc',marginBottom:'4px'}}>No chords match</div>
          <div style={{fontSize:'12px',color:'#666',marginBottom:'14px'}}>Try a different combination</div>
          <button onClick={clearFilters} style={{background:'#a29bfe',color:'#111',border:'none',padding:'8px 20px',borderRadius:'9px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Clear Filters</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(98px,1fr))',gap:'8px'}}>
          {list.map(chord=>{
            const ci=CATS[chord.cat];
            return(<div key={chord.id} onClick={()=>handleSel(chord.id)}
              style={{background:'#13121f',borderRadius:'10px',padding:'8px 6px 6px',border:`1px solid ${ci.color}22`,cursor:'pointer',textAlign:'center',transition:'all .15s',display:'flex',flexDirection:'column',alignItems:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=ci.color;e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=`${ci.color}22`;e.currentTarget.style.transform='none';}}>
              <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.78}/>
              <div style={{fontSize:'13px',fontWeight:900,marginTop:'4px',color:'#fff'}}>{chord.sym}</div>
              <div style={{fontSize:'9px',color:ci.color,fontWeight:600,marginTop:'1px',lineHeight:'1.2'}}>{chord.name}</div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}


function WeakTab({history,degHist,srs,showDeg,onComplete}){
  const[mode,setMode]=useState('chords');
  const weak=useMemo(()=>getWeakChords(history,srs),[history,srs]);
  const weakDegs=useMemo(()=>getWeakDegrees(degHist),[degHist]);
  const[drilling,setDrilling]=useState(false);
  if(drilling)return<ChordQuiz showDeg={showDeg} pool={weak} onComplete={r=>{onComplete(r);setDrilling(false);}} onBack={()=>setDrilling(false)}/>;
  return(<div style={{padding:'14px',maxWidth:'540px',margin:'0 auto'}}>
    <div style={{display:'flex',gap:'0',marginBottom:'14px',background:'#13121f',borderRadius:'10px',padding:'3px',border:'1px solid #2a2840'}}>
      {[{id:'chords',label:`🎸 Weak Chords (${weak.length})`},{id:'degrees',label:`🎼 Weak Degrees (${weakDegs.length})`}].map(m=>(<button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'8px 4px',borderRadius:'8px',cursor:'pointer',border:'none',background:mode===m.id?'#2a2840':'transparent',color:mode===m.id?'#ffd93d':'#888',fontSize:'11px',fontWeight:700,transition:'all .15s'}}>{m.label}</button>))}
    </div>
    {mode==='chords'&&(<div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',flexWrap:'wrap',gap:'5px'}}>
        <div><div style={{fontSize:'15px',fontWeight:900,color:'#fff'}}>Weak Chords</div><div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>Any incorrect answer or degraded SRS score</div></div>
        {weak.length>0&&<button onClick={()=>setDrilling(true)} style={{background:'#ff6b6b',color:'#fff',border:'none',padding:'8px 14px',borderRadius:'9px',fontSize:'11px',fontWeight:700,cursor:'pointer',minHeight:'40px'}}>Drill ({weak.length}) 🎯</button>}
      </div>
      {weak.length===0?(<div style={{textAlign:'center',padding:'28px',color:'#888'}}><div style={{fontSize:'32px',marginBottom:'5px'}}>🎉</div><div style={{fontWeight:700,color:'#ccc',fontSize:'13px'}}>No weak chords yet!</div></div>):(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {weak.map(chord=>{const ci=CATS[chord.cat],pct=chord.stats.n>0?Math.round(chord.stats.ok/chord.stats.n*100):null;return(
            <div key={chord.id} style={{background:'#13121f',borderRadius:'10px',padding:'9px',border:`1px solid ${ci.color}33`,display:'flex',alignItems:'center',gap:'8px'}}>
              <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.72}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{chord.name}</div>
                <div style={{fontSize:'8px',color:ci.color,marginBottom:'3px'}}>{ci.label}</div>
                {pct!==null&&<><div style={{background:'#1a1928',borderRadius:'3px',height:'3px',marginBottom:'2px'}}><div style={{background:pct>=70?'#00b894':'#ff6363',height:'3px',borderRadius:'3px',width:`${pct}%`}}/></div><div style={{fontSize:'8px',color:'#999'}}>{pct}% · {chord.stats.n} attempts</div></>}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>)}
    {mode==='degrees'&&(<div>
      <div style={{marginBottom:'10px'}}><div style={{fontSize:'15px',fontWeight:900,color:'#fff'}}>Weak Scale Degrees</div><div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>Below 70% accuracy</div></div>
      {weakDegs.length===0?(<div style={{textAlign:'center',padding:'28px',color:'#888'}}><div style={{fontSize:'32px',marginBottom:'5px'}}>🎉</div><div style={{fontWeight:700,color:'#ccc',fontSize:'13px'}}>No weak degrees yet!</div><div style={{fontSize:'11px',marginTop:'3px'}}>Complete Scale Degree training to see results.</div></div>):(
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {weakDegs.map((r,i)=>{const ci=CATS[r.chord.cat],pct=Math.round(r.ok/r.n*100);return(
            <div key={i} style={{background:'#13121f',borderRadius:'10px',padding:'9px',border:`1px solid ${DC[r.deg]||'#ffd93d'}33`,display:'flex',alignItems:'center',gap:'8px'}}>
              <ChordDiagram v={r.chord.voicings[0]} showDeg={true} size={0.72}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{r.chord.name}</div>
                <div style={{fontSize:'9px',color:ci.color,marginBottom:'3px'}}>{ci.label}</div>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}><span style={{fontSize:'10px',fontWeight:700,color:DC[r.deg]||'#ffd93d',background:(DC[r.deg]||'#ffd93d')+'22',padding:'1px 6px',borderRadius:'6px'}}>{r.deg}</span><span style={{fontSize:'9px',color:'#888'}}>{DEG_HINT[r.deg]||''}</span></div>
                <div style={{background:'#1a1928',borderRadius:'3px',height:'3px',marginBottom:'2px'}}><div style={{background:pct>=70?'#00b894':'#ff6363',height:'3px',borderRadius:'3px',width:`${pct}%`}}/></div>
                <div style={{fontSize:'8px',color:'#999'}}>{pct}% · {r.n} attempts</div>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>)}
  </div>);
}

// Build a ChordDetail-compatible object directly from a progression chord {sym, rn, v}.
// Always uses the exact inline voicing shown in the progression — no library lookup.
function progChordToDetail(c){
  const s=c.sym||'';
  let cat='shell';
  if(/ø|m7b5/i.test(s))cat='altered';
  else if(/dim|°/i.test(s))cat='altered';
  else if(/maj7|Δ/i.test(s))cat='shell';
  else if(/m7|min7/i.test(s))cat='shell';
  else if(/7/.test(s)&&!/maj/i.test(s))cat='shell';
  else if(/^[A-G][#b]?m/.test(s))cat='cowboy';
  else cat='cowboy';
  return{
    id:`prog_${s}_${c.rn}`,
    name:s,
    sym:s,
    cat,
    movable:false,
    voicings:[{label:`${c.rn} — from Progression of the Day`,str:c.v.str,deg:c.v.deg,sf:c.v.sf}],
  };
}

function ProgressionOfDay({showDeg,setSelChord}){
  const prog=useMemo(()=>{const d=new Date();const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000);return PROGS[doy%PROGS.length];},[]);
  return(<div style={{padding:'0 14px 14px',maxWidth:'560px',margin:'0 auto'}}>
    <div style={{marginBottom:'8px'}}>
      <div style={{fontSize:'16px',fontWeight:900,color:'#fff'}}>Progression of the Day</div>
      <div style={{display:'flex',gap:'5px',alignItems:'center',marginTop:'2px',flexWrap:'wrap'}}>
        <span style={{fontSize:'12px',color:'#ffd93d',fontWeight:700}}>{prog.title}</span>
        <span style={{fontSize:'8px',background:'#ffd93d22',color:'#ffd93d',padding:'1px 6px',borderRadius:'5px',fontWeight:700}}>{prog.feel}</span>
      </div>
      <div style={{fontSize:'10px',color:'#999',marginTop:'3px',lineHeight:'1.4'}}>{prog.desc}</div>
    </div>
    <div style={{display:'flex',gap:'8px',paddingBottom:'4px',alignItems:'flex-start',justifyContent:'center',flexWrap:'wrap'}}>
      {prog.chords.map((c,i)=>(<div key={i} style={{flexShrink:0,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div
          onClick={()=>setSelChord&&setSelChord(progChordToDetail(c))}
          style={{background:'#13121f',borderRadius:'9px',padding:'7px 5px 6px',border:'1px solid #2a2840',minWidth:'84px',cursor:setSelChord?'pointer':'default',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
          <ChordDiagram v={c.v} showDeg={showDeg} size={0.78}/>
          <div style={{fontSize:'12px',fontWeight:900,color:'#fff',marginTop:'2px'}}>{c.sym}</div>
          <div style={{fontSize:'8px',color:'#666',marginTop:'1px',marginBottom:'5px'}}>{c.rn}</div>
          <PlayButtons v={c.v} size="sm" stack/>
        </div>
        {i<prog.chords.length-1&&<div style={{color:'#333',fontSize:'16px',marginTop:'4px'}}>→</div>}
      </div>))}
    </div>
  </div>);
}

const ChordsOfDay=memo(function ChordsOfDay({srsData,showDeg,setShowDeg,onMarkReviewed}){
  // Snapshot both daily chords AND srs data at mount — display never changes
  // after first render, so App re-renders (from saveSrs/saveHist) can't cause glitches.
  const[daily]=useState(()=>getDailyChords(srsData));
  const[srsSnap]=useState(()=>({...srsData}));
  const[reviewed,setReviewed]=useState(new Set());
  const[selChord,setSelChord]=useState(null);

  const mark=useCallback(id=>{
    setReviewed(p=>new Set([...p,id]));
    onMarkReviewed(id); // fire-and-forget — state updates happen in parent but don't re-render us
  },[onMarkReviewed]);

  // When a chord detail is open, render it (ChordDetail handles auto-showDeg internally)
  if(selChord){
    return <ChordDetail chord={selChord} onBack={()=>setSelChord(null)} showDeg={showDeg} setShowDeg={setShowDeg}/>;
  }

  return(<div>
    <div style={{borderBottom:'1px solid #1a1928',paddingTop:'14px',paddingBottom:'14px'}}><ProgressionOfDay showDeg={showDeg} setSelChord={setSelChord}/></div>
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{marginBottom:'10px'}}>
        <div style={{fontSize:'16px',fontWeight:900,color:'#fff'}}>Chords of the Day</div>
        <div style={{color:'#999',fontSize:'11px',marginTop:'1px'}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</div>
        <div style={{marginTop:'6px',padding:'7px 10px',background:'#13121f',borderRadius:'8px',border:'1px solid #2a2840'}}>
          <div style={{fontSize:'11px',color:'#bbb',lineHeight:'1.5'}}>
            <span style={{color:'#ffd93d',fontWeight:700}}>Spaced Repetition (SRS)</span> — chords you know well appear less often. Chords you struggle with come back sooner. Mark each one "Got it" to update the schedule.
          </div>
        </div>
      </div>
      {daily.length===0?(
        <div style={{textAlign:'center',padding:'20px',color:'#888'}}>
          <div style={{fontSize:'26px',marginBottom:'4px'}}>✅</div>
          <div style={{fontWeight:700,color:'#ccc',fontSize:'12px'}}>All caught up for today!</div>
        </div>
      ):(
        <div>
          <div style={{marginBottom:'7px'}}><span style={{background:'#1a1928',borderRadius:'8px',padding:'3px 10px',fontSize:'10px',color:'#ffd93d'}}>{reviewed.size}/{daily.length} reviewed</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
            {daily.map((chord,idx)=>{
              // Use SNAPSHOT values — stable, never changes mid-session
              const ci=CATS[chord.cat];
              const srsEntry=srsSnap[chord.id];
              const isNew=!srsEntry;
              const isDue=srsEntry&&srsEntry.nextDue<=todayStr();
              const done=reviewed.has(chord.id);
              return(
                <div key={chord.id} style={{
                  background:'#13121f',borderRadius:'11px',padding:'10px',
                  border:`1px solid ${done?'#00b89444':ci.color+'33'}`,
                  display:'flex',alignItems:'center',gap:'9px',
                  opacity:done?0.55:1,
                  willChange:'opacity',
                  transition:'opacity .25s ease',
                  userSelect:'none',
                  WebkitTapHighlightColor:'transparent',
                }}>
                  <div style={{fontSize:'13px',fontWeight:900,color:'#444',minWidth:'13px',textAlign:'center'}}>{idx+1}</div>
                  {/* Tappable area — opens chord detail */}
                  <div onClick={()=>setSelChord(chord)} style={{display:'flex',alignItems:'center',gap:'9px',flex:1,minWidth:0,cursor:'pointer',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
                    <ChordDiagram v={chord.voicings[0]} showDeg={showDeg} size={0.76}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap',marginBottom:'1px'}}>
                        <span style={{fontWeight:700,fontSize:'12px',color:'#fff'}}>{chord.name}</span>
                        {isNew&&<span style={{fontSize:'8px',background:'#a29bfe22',color:'#a29bfe',padding:'1px 5px',borderRadius:'5px',fontWeight:700}}>NEW</span>}
                        {isDue&&!isNew&&<span style={{fontSize:'8px',background:'#ffd93d22',color:'#ffd93d',padding:'1px 5px',borderRadius:'5px',fontWeight:700}}>REVIEW</span>}
                      </div>
                      <div style={{fontSize:'8px',color:ci.color,marginBottom:'1px'}}>{ci.label}</div>
                      <div style={{fontSize:'8px',color:'#777'}}>{chord.voicings[0].label}</div>
                      {/* Always render this line (stable height) — no conditional mount/unmount */}
                      <div style={{fontSize:'8px',color:'#555',marginTop:'1px',minHeight:'11px'}}>
                        {srsEntry?`${srsEntry.reps} reps · next in ${srsEntry.interval}d`:'\u00a0'}
                      </div>
                      <div style={{marginTop:'5px',display:'flex',alignItems:'center',gap:'5px'}}>
                        <PlayButtons v={chord.voicings[0]} size="sm"/>
                        <span style={{fontSize:'9px',color:'#333'}}>· tap to explore</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={()=>!done&&mark(chord.id)}
                    style={{
                      background:done?'#00b89422':'#ffd93d22',
                      color:done?'#00b894':'#ffd93d',
                      border:`1px solid ${done?'#00b89444':'#ffd93d88'}`,
                      padding:'7px 8px',borderRadius:'8px',
                      cursor:done?'default':'pointer',
                      fontSize:'11px',fontWeight:700,
                      whiteSpace:'nowrap',minHeight:'44px',minWidth:'64px',
                      // Hard lock: once done, no pointer events whatsoever
                      pointerEvents:done?'none':'auto',
                      // Only transition the visual properties, never layout/text
                      transition:'background .2s,color .2s,border-color .2s',
                      WebkitTapHighlightColor:'transparent',
                      touchAction:'manipulation',
                    }}
                  >{done?'✓ Done':'Got it'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>);
// Custom memo comparator: only re-render when showDeg changes.
// srsData prop changes (from App's saveSrs/saveHist) are ignored because
// we already snapshotted it at mount. onMarkReviewed is stable (ref pattern in App).
},(prev,next)=>prev.showDeg===next.showDeg);

// ── INSTALL BANNER ────────────────────────────────────────────────────────
// Shows a native-feeling bottom sheet prompting the user to add to home screen.
// Hidden when: already running as standalone PWA, or not on a multiple-of-5 launch.
function InstallBanner(){
  const[visible,setVisible]=useState(false);
  const[deferredPrompt,setDeferredPrompt]=useState(null);

  useEffect(()=>{
    // Never show if already running as standalone PWA
    const isStandalone=window.matchMedia('(display-mode: standalone)').matches||
      window.navigator.standalone===true;
    if(isStandalone)return;

    // Increment launch counter on every page load, show on every 5th launch (1, 5, 10, 15…)
    let launches=1;
    try{
      launches=parseInt(localStorage.getItem('ct_launches')||'0',10)+1;
      localStorage.setItem('ct_launches',String(launches));
    }catch(e){}
    // Show on launch 1 and every 5th launch after that
    if(launches!==1&&launches%5!==0)return;

    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroidChrome=/android/i.test(navigator.userAgent)&&/chrome/i.test(navigator.userAgent);

    if(isIOS){
      const t=setTimeout(()=>setVisible(true),2500);
      return()=>clearTimeout(t);
    }
    if(isAndroidChrome){
      const handler=e=>{e.preventDefault();setDeferredPrompt(e);setVisible(true);};
      window.addEventListener('beforeinstallprompt',handler);
      return()=>window.removeEventListener('beforeinstallprompt',handler);
    }
  },[]);

  // Dismiss hides the banner for this session only — launch counter keeps running
  const dismiss=()=>setVisible(false);

  const installAndroid=async()=>{
    if(!deferredPrompt)return;
    deferredPrompt.prompt();
    const{outcome}=await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if(!visible)return null;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);

  return(
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,zIndex:9999,
      padding:'12px 16px',paddingBottom:'max(12px,env(safe-area-inset-bottom))',
      background:'#1a1928',borderTop:'1px solid #2a2840',
      boxShadow:'0 -8px 32px #00000066',
      display:'flex',flexDirection:'column',gap:'10px',
      animation:'slideUp .3s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{fontSize:'26px',lineHeight:1,flexShrink:0}}>🎸</div>
          <div>
            <div style={{fontSize:'13px',fontWeight:800,color:'#fff',marginBottom:'1px'}}>
              {isIOS?'Get the full experience — add to Home Screen':'Practice anytime — install ChordTrainer'}
            </div>
            <div style={{fontSize:'11px',color:'#888'}}>
              {isIOS
                ?<>Tap <span style={{color:'#ffd93d',fontWeight:700}}>Share ⎙</span> → <span style={{color:'#ffd93d',fontWeight:700}}>Add to Home Screen</span></>
                :'Full-screen, works offline, opens instantly'}
            </div>
          </div>
        </div>
        <button onClick={dismiss} style={{background:'transparent',border:'none',color:'#444',fontSize:'22px',cursor:'pointer',padding:'0 2px',lineHeight:1,flexShrink:0,touchAction:'manipulation'}}>×</button>
      </div>
      {!isIOS&&(
        <button onClick={installAndroid} style={{background:'#ffd93d',color:'#111',border:'none',padding:'10px',borderRadius:'10px',fontSize:'13px',fontWeight:800,cursor:'pointer',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
          Install
        </button>
      )}
    </div>
  );
}

function HelpTab(){
  const[openTier,setOpenTier]=useState(null);
  const toggleTier=id=>setOpenTier(cur=>cur===id?null:id);
  const sections=[
    {icon:'🧠',title:'Spaced Repetition',color:'#00b894',desc:"ChordTrainer uses the SM-2 algorithm (same as Anki) to schedule your practice. Each chord has an ease factor — answer correctly and the review interval grows; answer wrong and it resets to tomorrow. The higher the ease factor, the better you know the chord."},
    {icon:'🌅',title:'Today',color:'#74b9ff',desc:"Your daily practice hub. Opens with the Progression of the Day, followed by your SRS review queue. Tap any chord diagram to open its full detail view. Mark each chord 'Got it' to record your review and schedule the next one."},
    {icon:'📚',title:'Library',color:'#ffd93d',desc:'Browse all 120 chord voicings. Tap any card to open the full detail — diagram, transpose tool, degree guide, and audio. Use the 🎛 Filter Chords panel to narrow down by type and quality.',sub:[
      {label:'🎯 Family Filter',text:'Pick one of 7 mutually exclusive sonic families — Major, Dominant, Minor, Half-dim (ø), Diminished, Augmented, or Suspended. Dominant is correctly separated from Major (it has a ♭7). Half-dim has its own family rather than being lumped with minor.'},
      {label:'🔧 Builder Filter',text:'Build the chord you want in 3 steps: choose a Triad Base (maj, m, sus2, sus4, aug, dim) → optionally add a 7th interval (♭7, Δ7, or °7) → optionally add Color Tones (9, ♭9, ♯9, 11, ♯11, 13, ♭13, 6). A live label shows the resulting chord type as you build, e.g. Minor + ♭7 = "Minor 7th", or Dim + ♭7 = "Half-dim ø".'},
    ]},
    {icon:'🎯',title:'Quiz',color:'#4ecdc4',desc:'Two modes:',sub:[{label:'Chord Quiz',text:'Name→Shape or Shape→Name. Filter by category.'},{label:'Scale Degrees',text:'Tap the dot on the diagram matching the asked degree. Wrong answers reveal all degrees before you move on.'}]},
    {icon:'💪',title:'Weak',color:'#ff6b6b',desc:'Auto-tracks problem areas:',sub:[{label:'Weak Chords',text:'Chords answered incorrectly or with a degraded SRS ease factor.'},{label:'Weak Degrees',text:"Specific degree+chord combos you've struggled to identify."}]},
    {icon:'💾',title:'Export / Import',color:'#fd79a8',desc:"Your progress is saved automatically and persists across sessions. Use ⬆⬇ Data in the header to export a JSON backup or import on another device."},
  ];
  const tiers=[
    {id:'guide',tier:'Guide Tones',stars:'★★★',color:'#ffd93d',short:'3, b3, 7, b7 — define the chord. Target these.',desc:'The 3rd and 7th define chord quality and create smooth voice leading. Bass covers the root — soloists target guide tones.',degrees:[{d:'3',note:'Defines major quality'},{d:'b3',note:'Defines minor quality'},{d:'7',note:'Lift and colour'},{d:'b7',note:'Tension & resolution'}]},
    {id:'root',tier:'Root',stars:'★★',color:'#ff4757',short:'R — tonal anchor. Safe but use sparingly.',desc:'Strong landing point but bass owns it. Sitting on it too much makes a solo sound static.',degrees:[{d:'R',note:'Anchor — use sparingly'}]},
    {id:'ext',tier:'Safe Extensions',stars:'★★',color:'#2ed573',short:'9, 13, 6, #11 — add colour freely.',desc:'Consonant notes above the chord tones. Blend smoothly — you can linger on these.',degrees:[{d:'9',note:'Smooth over most chords'},{d:'13',note:'Open, airy'},{d:'6',note:'Sweet, consonant'},{d:'#11',note:'Lydian brightness'}]},
    {id:'neutral',tier:'Neutral',stars:'★',color:'#778ca3',short:'5 — stable but boring. Pass through it.',desc:'The perfect 5th is harmonically safe but the least interesting note to land on.',degrees:[{d:'5',note:'Stable but bland'}]},
    {id:'tension',tier:'Tension Tones',stars:'⚡',color:'#7c5cbf',short:'b9, #9, b13, b5 — use with intent, resolve.',desc:'Strong dissonance. Over a dominant chord heading to resolution these sound spectacular.',degrees:[{d:'b9',note:'Dark tension'},{d:'#9',note:'Hendrix note'},{d:'b13',note:'Altered colour'},{d:'b5',note:'Tritone'},{d:'#5',note:'Augmented tension'},{d:'bb7',note:'Diminished'}]},
    {id:'sus',tier:'Suspended',stars:'',color:'#74b9ff',short:'4, 2, 11 — floating, unresolved.',desc:'Sus chords replace the 3rd with a 2nd or 4th, creating a floating quality.',degrees:[{d:'4',note:'Resolves to 3rd'},{d:'2',note:'Open, unresolved'},{d:'11',note:'Upper 4th'}]},
  ];
  return(
    <div style={{padding:'14px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{fontSize:'15px',fontWeight:900,color:'#fff',marginBottom:'8px'}}>App Features</div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'20px'}}>
        {sections.map((s,i)=>(
          <div key={i} style={{background:'#13121f',borderRadius:'10px',border:`1px solid ${s.color}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px 6px'}}>
              <span style={{fontSize:'16px',flexShrink:0}}>{s.icon}</span>
              <span style={{fontWeight:700,fontSize:'13px',color:s.color}}>{s.title}</span>
            </div>
            <div style={{padding:'0 12px 11px'}}>
              <div style={{fontSize:'12px',color:'#ccc',lineHeight:'1.6'}}>{s.desc}</div>
              {s.sub&&<div style={{marginTop:'7px',display:'flex',flexDirection:'column',gap:'4px'}}>
                {s.sub.map((sub,j)=>(<div key={j} style={{background:'#0f0e17',borderRadius:'7px',padding:'7px 9px',border:'1px solid #2a2840'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#ffd93d',marginBottom:'2px'}}>{sub.label}</div>
                  <div style={{fontSize:'11px',color:'#aaa',lineHeight:'1.4'}}>{sub.text}</div>
                </div>))}
              </div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:'15px',fontWeight:900,color:'#fff',marginBottom:'4px'}}>Chord Diagrams & Degree Colours</div>
      <div style={{fontSize:'12px',color:'#bbb',lineHeight:'1.6',marginBottom:'10px'}}>
        <span style={{color:'#ffd93d',fontWeight:700}}>Tap any chord diagram</span> — on the Today tab, in the Progression of the Day, or in the Library — to open the full detail view. You'll see the voicing at a larger size, an audio player, a transpose tool for movable shapes, and the degree guide below.{' '}
        <span style={{color:'#ffd93d',fontWeight:700}}>Scale Degrees</span> turn on automatically when a detail opens, and restore to their previous state when you go back.
      </div>
      <div style={{padding:'9px 12px',background:'#13121f',borderRadius:'9px',border:'1px solid #2a2840',marginBottom:'12px'}}>
        <div style={{fontSize:'11px',color:'#bbb',lineHeight:'1.6'}}>Enable <span style={{color:'#ffd93d',fontWeight:700}}>Scale Degrees</span> in the header to colour-code every dot on every diagram throughout the app. The colours are grouped by harmonic function — tap any tier below to learn what each colour means and when to use those notes.</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'16px'}}>
        {tiers.map(t=>{
          const open=openTier===t.id;
          return(
            <div key={t.id} style={{background:'#13121f',borderRadius:'10px',border:`1px solid ${open?t.color+'66':t.color+'22'}`,overflow:'hidden',transition:'border-color .2s'}}>
              <button onClick={()=>toggleTier(t.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'11px 12px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:t.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontWeight:700,fontSize:'13px',color:t.color}}>{t.tier}</span>
                    {t.stars&&<span style={{fontSize:'10px',color:'#ffd93d'}}>{t.stars}</span>}
                  </div>
                  <div style={{fontSize:'11px',color:'#888',marginTop:'1px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.short}</div>
                </div>
                <span style={{color:'#555',fontSize:'14px',flexShrink:0,display:'inline-block',transition:'transform .2s',transform:open?'rotate(180deg)':'none'}}>▾</span>
              </button>
              {open&&(<div style={{padding:'0 12px 12px'}}>
                <div style={{fontSize:'12px',color:'#ccc',lineHeight:'1.6',marginBottom:'9px'}}>{t.desc}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {t.degrees.map(({d,note})=>(
                    <div key={d} style={{display:'flex',alignItems:'center',gap:'5px',background:'#0f0e17',borderRadius:'7px',padding:'5px 8px',border:`1px solid ${DC[d]}44`}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:DC[d],flexShrink:0}}/>
                      <span style={{fontSize:'11px',fontWeight:700,color:DC[d]}}>{d}</span>
                      <span style={{fontSize:'10px',color:'#888'}}>{note}</span>
                    </div>
                  ))}
                </div>
              </div>)}
            </div>
          );
        })}
      </div>
      <div style={{textAlign:'center',padding:'10px',background:'#13121f',borderRadius:'10px',border:'1px solid #2a2840'}}>
        <div style={{fontSize:'12px',color:'#555'}}>Made with 🎸 by <span style={{color:'#ffd93d',fontWeight:700}}>Zak</span></div>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState('daily');
  const[showDeg,setShowDeg]=useState(false);
  const[srs,setSrs]=useState({});
  const[hist,setHist]=useState([]);
  const[degHist,setDegHist]=useState([]);
  const[loaded,setLoaded]=useState(false);
  const[showData,setShowData]=useState(false);
  const[importMsg,setImportMsg]=useState('');

  // Refs for async callbacks — always fresh values, never cause re-renders
  const srsRef=useRef(srs);
  const histRef=useRef(hist);
  const degHistRef=useRef(degHist);
  srsRef.current=srs;
  histRef.current=hist;
  degHistRef.current=degHist;

  // Inject global mobile CSS once at mount
  useEffect(()=>{
    const style=document.createElement('style');
    style.textContent=`
      *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
      button,a,label,[role=button]{touch-action:manipulation;-webkit-user-select:none;user-select:none;}
      body{overscroll-behavior-y:none;-webkit-overflow-scrolling:touch;}
      input,textarea,select{font-size:16px!important;}
    `;
    // ── Generate app icon via canvas and inject as apple-touch-icon + manifest ──
    function makeIcon(size){
      const c=document.createElement('canvas');c.width=c.height=size;
      const ctx=c.getContext('2d');
      const r=size*0.22; // corner radius
      // Background
      ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(size-r,0);ctx.quadraticCurveTo(size,0,size,r);
      ctx.lineTo(size,size-r);ctx.quadraticCurveTo(size,size,size-r,size);
      ctx.lineTo(r,size);ctx.quadraticCurveTo(0,size,0,size-r);
      ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);ctx.closePath();
      ctx.fillStyle='#0f0e17';ctx.fill();
      // Gold outer ring
      ctx.strokeStyle='#ffd93d';ctx.lineWidth=size*0.03;ctx.stroke();
      // Guitar pick shape (rounded triangle pointing down, centered)
      const cx=size/2,cy=size/2*0.96;
      const pw=size*0.54,ph=size*0.62,pr=size*0.12;
      ctx.beginPath();
      ctx.moveTo(cx,cy+ph/2);                        // bottom tip
      ctx.quadraticCurveTo(cx-pr,cy+ph/2-pr, cx-pw/2,cy);// left side
      ctx.quadraticCurveTo(cx-pw/2-pr*0.3,cy-ph/2+pr, cx-pw/2+pr,cy-ph/2); // top-left
      ctx.quadraticCurveTo(cx,cy-ph/2-pr*0.2, cx+pw/2-pr,cy-ph/2); // top-right
      ctx.quadraticCurveTo(cx+pw/2+pr*0.3,cy-ph/2+pr, cx+pw/2,cy);// right side
      ctx.quadraticCurveTo(cx+pr,cy+ph/2-pr, cx,cy+ph/2);
      ctx.closePath();
      // Pick gradient: bright gold to warm amber
      const g=ctx.createLinearGradient(cx-pw/2,cy-ph/2,cx+pw/2,cy+ph/2);
      g.addColorStop(0,'#ffd93d');g.addColorStop(1,'#e6a800');
      ctx.fillStyle=g;ctx.fill();
      // Inner shadow line on pick
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=size*0.015;ctx.stroke();
      // "CT" text on pick
      const fs=size*0.2;
      ctx.font=`900 ${fs}px 'Segoe UI',system-ui,sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#0f0e17';
      ctx.fillText('CT',cx,cy-ph*0.05);
      // Small dot below text (like a guitar string)
      ctx.beginPath();ctx.arc(cx,cy+ph*0.22,size*0.025,0,Math.PI*2);
      ctx.fillStyle='#0f0e17';ctx.fill();
      return c.toDataURL('image/png');
    }

    const iconUrl=makeIcon(512);
    const iconUrl180=makeIcon(180);

    // apple-touch-icon (iOS home screen)
    const setLink=(rel,sizes,href)=>{
      let l=document.querySelector(`link[rel="${rel}"]${sizes?`[sizes="${sizes}"]`:''}`);
      if(!l){l=document.createElement('link');l.rel=rel;if(sizes)l.sizes=sizes;document.head.appendChild(l);}
      l.href=href;
    };
    setLink('apple-touch-icon','180x180',iconUrl180);
    setLink('icon','512x512',iconUrl);

    document.head.appendChild(style);
    // Theme + viewport
    const setMeta=(name,content)=>{let m=document.querySelector(`meta[name="${name}"]`);if(!m){m=document.createElement('meta');m.name=name;document.head.appendChild(m);}m.content=content;};
    setMeta('theme-color','#0f0e17');
    setMeta('viewport','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    setMeta('apple-mobile-web-app-capable','yes');
    setMeta('apple-mobile-web-app-status-bar-style','black-translucent');
    setMeta('apple-mobile-web-app-title','ChordTrainer');

    // Web app manifest with generated icon
    const manifest={
      name:'ChordTrainer',short_name:'ChordTrainer',
      description:'Guitar chord training with SRS, scale degrees, and progressions.',
      start_url:'.',display:'standalone',orientation:'portrait',
      background_color:'#0f0e17',theme_color:'#0f0e17',
      icons:[
        {src:iconUrl180,sizes:'180x180',type:'image/png'},
        {src:iconUrl,sizes:'512x512',type:'image/png'},
      ],
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
    const murl=URL.createObjectURL(blob);
    let mlink=document.querySelector('link[rel="manifest"]');
    if(!mlink){mlink=document.createElement('link');mlink.rel='manifest';document.head.appendChild(mlink);}
    mlink.href=murl;

    return()=>{document.head.removeChild(style);URL.revokeObjectURL(murl);};
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const s=await store.get('ct_srs');
        const h=await store.get('ct_hist');
        const d=await store.get('ct_degh');
        if(s)setSrs(JSON.parse(s.value));
        if(h)setHist(JSON.parse(h.value));
        if(d)setDegHist(JSON.parse(d.value));
      }catch(e){}
      setLoaded(true);
    })();
  },[]);

  const saveSrs=async d=>{setSrs(d);try{await store.set('ct_srs',JSON.stringify(d));}catch(e){}};
  const saveHist=async d=>{setHist(d);try{await store.set('ct_hist',JSON.stringify(d));}catch(e){}};
  const saveDegHist=async d=>{setDegHist(d);try{await store.set('ct_degh',JSON.stringify(d));}catch(e){}};

  const onChordQuizDone=useCallback(async results=>{
    const ns={...srsRef.current},nh=[...histRef.current],td=todayStr();
    for(const r of results){ns[r.id]=updateSRS(ns[r.id],r.correct);nh.push({id:r.id,correct:r.correct,date:td});}
    await saveSrs(ns);await saveHist(nh);
  },[]); // eslint-disable-line

  const onDegDone=useCallback(async results=>{
    const nd=[...degHistRef.current,...results.map(r=>({...r,date:todayStr()}))];
    await saveDegHist(nd);
  },[]); // eslint-disable-line

  // STABLE callback — empty deps, reads fresh state via refs.
  // ChordsOfDay is React.memo'd and ignores srsData/onMarkReviewed prop changes,
  // so the 2 setSrs+setHist calls here never cause ChordsOfDay to re-render.
  const onMarkReviewed=useCallback(async id=>{
    const ns={...srsRef.current,[id]:updateSRS(srsRef.current[id],true)};
    const nh=[...histRef.current,{id,correct:true,date:todayStr()}];
    await saveSrs(ns);await saveHist(nh);
  },[]); // eslint-disable-line

  const exportData=()=>{
    const json=JSON.stringify({srs,hist,degHist,v:2,exported:new Date().toISOString()},null,2);
    const a=document.createElement('a');
    a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
    a.download=`chordtrainer-${todayStr()}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };

  const importData=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data.srs)await saveSrs(data.srs);
        if(data.hist)await saveHist(data.hist);
        if(data.degHist)await saveDegHist(data.degHist);
        setImportMsg('✓ Imported!');setTimeout(()=>setImportMsg(''),3000);
      }catch(err){setImportMsg('✗ Invalid file');}
      e.target.value='';
    };
    reader.readAsText(file);
  };

  if(!loaded)return(<div style={{background:'#0f0e17',minHeight:'100vh',minHeight:'-webkit-fill-available',display:'flex',alignItems:'center',justifyContent:'center',color:'#ffd93d',fontSize:'16px'}}>Loading…</div>);

  const TABS=[{id:'daily',label:'Today',icon:'🌅'},{id:'library',label:'Library',icon:'📚'},{id:'progs',label:'Progs',icon:'🎵'},{id:'quiz',label:'Quiz',icon:'🎯'},{id:'weak',label:'Weak',icon:'💪'},{id:'help',label:'Guide',icon:'📖'}];

  return(
    <div style={{background:'#0f0e17',minHeight:'100vh',color:'#fffffe',fontFamily:"'Segoe UI',system-ui,sans-serif",maxWidth:'100vw',overflowX:'hidden',WebkitFontSmoothing:'antialiased'}}>
      <div style={{padding:'10px 12px',paddingTop:'max(10px,env(safe-area-inset-top))',borderBottom:'1px solid #1a1928',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'16px',fontWeight:900,lineHeight:'1.1'}}>🎸 <span style={{color:'#ffd93d'}}>Chord</span>Trainer</div>
          <div style={{fontSize:'9px',color:'#555',letterSpacing:'1px',paddingLeft:'22px'}}>by Zak</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'7px',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button onClick={()=>setShowData(p=>!p)} style={{background:'transparent',border:'1px solid #2a2840',color:'#888',padding:'5px 9px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',minHeight:'36px',whiteSpace:'nowrap',touchAction:'manipulation'}}>⬆⬇ Data</button>
          <button onClick={()=>setShowDeg(p=>!p)} style={{padding:'7px 12px',borderRadius:'9px',cursor:'pointer',fontSize:'11px',fontWeight:700,border:`2px solid ${showDeg?'#ffd93d':'#555'}`,background:showDeg?'#ffd93d':'transparent',color:showDeg?'#111':'#bbb',transition:'background .2s,color .2s,border-color .2s,box-shadow .2s',minHeight:'36px',whiteSpace:'nowrap',boxShadow:showDeg?'0 0 12px #ffd93d55':'none',touchAction:'manipulation'}}>
            {showDeg?'✦ Degrees ON':'Scale Degrees'}
          </button>
        </div>
      </div>
      {showData&&(
        <div style={{background:'#13121f',borderBottom:'1px solid #1a1928',padding:'9px 12px',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
          <span style={{fontSize:'10px',color:'#888'}}>Progress backup:</span>
          <button onClick={exportData} style={{background:'#a29bfe22',color:'#a29bfe',border:'1px solid #a29bfe44',padding:'5px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:700,minHeight:'36px',touchAction:'manipulation'}}>Export ↓</button>
          <label style={{background:'#4ecdc422',color:'#4ecdc4',border:'1px solid #4ecdc444',padding:'5px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'10px',fontWeight:700,minHeight:'36px',display:'flex',alignItems:'center',touchAction:'manipulation'}}>Import ↑<input type="file" accept=".json" onChange={importData} style={{display:'none'}}/></label>
          {importMsg&&<span style={{fontSize:'10px',color:importMsg.startsWith('✓')?'#00b894':'#ff6363',fontWeight:700}}>{importMsg}</span>}
          <span style={{fontSize:'9px',color:'#444',marginLeft:'auto'}}>{Object.keys(srs).length} SRS · {hist.length} history · {degHist.length} deg</span>
        </div>
      )}
      {/* Tab bar — 44px min-height per Apple HIG; overflowX hidden but scrollable to avoid clipping */}
      <div style={{display:'flex',borderBottom:'1px solid #1a1928',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
        {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:'0 0 auto',padding:'10px 10px',background:'transparent',border:'none',cursor:'pointer',fontSize:'10px',fontWeight:600,color:tab===t.id?'#ffd93d':'#888',borderBottom:tab===t.id?'2px solid #ffd93d':'2px solid transparent',whiteSpace:'nowrap',minHeight:'44px',touchAction:'manipulation'}}>{t.icon} {t.label}</button>))}
      </div>
      {/* Safe-area bottom padding + extra room for install banner */}
      <div style={{paddingBottom:'max(32px,env(safe-area-inset-bottom))'}}>
        {tab==='daily'&&<ChordsOfDay srsData={srs} showDeg={showDeg} setShowDeg={setShowDeg} onMarkReviewed={onMarkReviewed}/>}
        {tab==='library'&&<Library showDeg={showDeg} setShowDeg={setShowDeg}/>}
        {tab==='progs'&&<ProgressionsTab showDeg={showDeg}/>}
        {tab==='quiz'&&<QuizTab showDeg={showDeg} onChordQuizDone={onChordQuizDone} onDegDone={onDegDone}/>}
        {tab==='weak'&&<WeakTab history={hist} degHist={degHist} srs={srs} showDeg={showDeg} onComplete={onChordQuizDone}/>}
        {tab==='help'&&<HelpTab/>}
      </div>
      <InstallBanner/>
    </div>
  );
}
