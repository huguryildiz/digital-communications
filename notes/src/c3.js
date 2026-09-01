/* Course notes — Chapter 3. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
const S1=t=>(t>=0&&t<2)?1:0, S2=t=>(t>=2&&t<3)?1:0, S3=t=>(t>=0&&t<3)?1:0;

function wave(f,name,col,yr){
  const a=ax({w:300,h:160,xr:[-0.2,3.4],yr:yr||[-0.3,1.4],xlabel:'t',ylabel:name,
    pad:{l:44,r:18,t:20,b:34},xtarget:4,ytarget:3});
  const pts=[]; for(let i=0;i<=680;i++){const t=-0.2+3.6*i/680; pts.push([t,f(t)]);}
  a.poly(pts,{color:col||C.in,width:2});
  return a.svg();
}

window.C3 = [

{t:'h1', num:'CHAPTER 3', text:'Geometric representation of signal waveforms'},
{t:'p', lead:true, text:'This chapter changes the language, not the subject. A set of waveforms is written as a set of points. Once that is done, the receiver becomes a question about geometry, and the answers are arithmetic instead of integrals.'},

{t:'h2', num:'3.1', text:'Why one axis is not enough'},
{t:'p', text:'In Chapter 2 the two waveforms were opposites. One shape carried both, the receiver produced one number, and everything followed from that. Now suppose the two waveforms are simply different: neither is a multiple of the other. No single function can write both as a multiple of itself, so the receiver of Chapter 2 does not apply.'},
{t:'p', text:'The fix is to use two matched filters, one for each waveform, and let the receiver work with the two numbers they produce. A pair of numbers is a point in a plane. That plane is the subject of this chapter.'},

{t:'h2', num:'3.2', text:'Signals as vectors'},
{t:'p', text:'A vector is a list of numbers because it has been written against a set of axes. A signal can be a list of numbers for the same reason. The only thing needed is an inner product, and for signals it is the integral of the product.'},
{t:'eqbox', cap:'Inner product, energy and orthogonality', tex:[
  '\\langle x,y\\rangle=\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt',
  '\\int_{-\\infty}^{\\infty}\\psi_j(t)\\psi_k(t)\\,dt=\\begin{cases}1,&j=k\\\\0,&j\\ne k\\end{cases}'],
 after:'The second line defines an <b>orthonormal</b> set. The first case says each function has unit energy. The second says any two of them are orthogonal.'},
{t:'box', kind:'def', hd:'Orthogonal signals', html:'Orthogonal signals have zero inner product. Multiply the signals and integrate the result over all time. Nonoverlapping pulses are a simple example. Where one pulse is nonzero, the other is zero. Therefore, their product is zero everywhere.'},
{t:'p', text:'With the axes fixed, a signal is written against them the same way a vector is. One integral per axis takes the waveform apart. Adding the pieces back builds it again.'},
{t:'eqbox', cap:'Coordinates', tex:[
  's_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt',
  's_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t)'],
 after:'The list $\\mathbf{s}_i=(s_{i1},\\ldots,s_{iN})$ is the <b>signal vector</b>.'},
{t:'p', text:'The reason this is worth doing is that inner products survive the translation. Expand both signals in the basis, exchange the integral with the sums, and use orthonormality: every cross term vanishes and every matching term contributes one. An integral over waveforms becomes a sum over $N$ numbers.'},
{t:'eqbox', cap:'The property the chapter rests on', tex:[
  '\\int_{-\\infty}^{\\infty}x(t)y(t)\\,dt=\\sum_{k=1}^{N}x_ky_k',
  'E_{s_i}=\\|\\mathbf{s}_i\\|^{2}=\\sum_{j=1}^{N}s_{ij}^{2},\\qquad \\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int_0^T\\bigl(s_i-s_k\\bigr)^{2}dt'],
 after:'<b>Energy is how far a point is from the origin.</b> That is what the transmitter pays for. <b>Distance is how far two points are from each other.</b> That is what decides how often the receiver confuses them.'},

{t:'h2', num:'3.3', text:'The constellation diagram'},
{t:'p', text:'The constellation is the picture of the signal vectors in the space their basis spans: one point per waveform, one axis per basis function. Three things are read straight off it. The distance from the origin to a point is the square root of that signal\'s energy. The distance between two points is the square root of the energy of their difference. The number of axes is the number of matched filters the receiver needs.'},
{t:'box', kind:'warn', hd:'Geometric equivalence', html:'Different waveform sets can have the same constellation. Such sets have the same receiver structure and error probability in white Gaussian noise. The constellation does not determine bandwidth. Waveform shape and the Chapter 2 criteria determine bandwidth.'},

{t:'h2', num:'3.4', text:'The Gram–Schmidt procedure'},
{t:'p', text:'The previous sections assumed known axes. Gram–Schmidt produces them from any waveform set. Take the next signal. Remove its components along the existing axes. Normalize the nonzero remainder to form a new axis.'},
{t:'eqbox', cap:'The procedure', tex:[
  '\\psi_1(t)=\\frac{s_1(t)}{\\sqrt{E_1}},\\qquad s_{11}=\\sqrt{E_1}',
  'g_k(t)=s_k(t)-\\sum_{i=1}^{k-1}s_{ki}\\psi_i(t),\\qquad \\psi_k(t)=\\frac{g_k(t)}{\\sqrt{E_{g_k}}}'],
 after:'If $g_k(t)=0$ the signal was already a combination of the axes found so far and <b>no new axis is added</b>. The number of axes $N$ is therefore at most the number of signals $M$, and is often fewer.'},
{t:'box', kind:'ok', hd:'The order changes the axes, not the answer', html:'Starting from a different signal gives a different basis. It gives the same number of axes, the same energies and the same distances. Therefore, the constellation is the same picture seen from a different angle. Every result that depends only on distances is unchanged. In Chapter 4 every result depends only on distances.'},

{t:'ex', hd:'Example 3.1 — three pulses, two axes', rows:[
 ['Given','$s_1(t)=1$ on $[0,2]$; $s_2(t)=1$ on $[2,3]$; $s_3(t)=1$ on $[0,3]$; each zero elsewhere.'],
 ['Find','An orthonormal basis, the three signal vectors, and the constellation.'],
 ['Method','Normalise the first signal. Then, for each later signal, subtract the part that lies along the axes already found and normalise the remainder.'],
 ['Step 1','$E_1=\\int_0^{2}1\\,dt=2$, so $\\psi_1(t)=1/\\sqrt{2}$ on $[0,2]$ and $s_{11}=\\sqrt{2}$.'],
 ['Step 2','$s_{21}=\\int s_2\\psi_1\\,dt=0$, because the two never overlap. So $g_2=s_2$, its energy is $1$, and $\\psi_2(t)=s_2(t)$.'],
 ['Step 3','$s_{31}=\\sqrt{2}$ and $s_{32}=1$, and then $g_3=s_3-\\sqrt{2}\\psi_1-\\psi_2=0$. No third axis is added.'],
 ['Vectors','$\\mathbf{s}_1=(\\sqrt{2},0)$, $\\;\\mathbf{s}_2=(0,1)$, $\\;\\mathbf{s}_3=(\\sqrt{2},1)$.'],
 ['Check','Energies from the vectors are $2$, $1$ and $3$. From the waveforms: height one for two seconds, one second and three seconds, giving $2$, $1$ and $3$. They agree, and that agreement is the whole content of "energy is squared length". Three waveforms needed only two axes, because $s_3=s_1+s_2$ — visible in the pictures before any integral is computed.']
]},

{t:'figrow', n:3, items:[
 {svg:()=>wave(S1,'s_1(t)',C.in), cap:'$s_1$'},
 {svg:()=>wave(S2,'s_2(t)',C.out), cap:'$s_2$'},
 {svg:()=>wave(S3,'s_3(t)',C.mid), cap:'$s_3=s_1+s_2$'}
]},

{t:'fig', svg:()=>{
  const a=ax({w:420,h:260,xr:[-0.5,2.0],yr:[-0.5,1.7],xlabel:'\\psi_1',ylabel:'\\psi_2',
    pad:{l:50,r:22,t:24,b:38},xtarget:4,ytarget:4});
  [[Math.SQRT2,0,C.in],[0,1,C.out],[Math.SQRT2,1,C.mid]].forEach(([x,y,c])=>{
    a.poly([[x,0],[x,y]],{color:C.rule,width:1,dash:'3 4'});
    a.poly([[0,y],[x,y]],{color:C.rule,width:1,dash:'3 4'});
    a.point(x,y,{color:c,r:6});
  });
  return a.svg();
}, cap:'The constellation. Two axes carry three signals. The point furthest from the origin is $\\mathbf{s}_3$, whose energy is $3$. The two nearest points are $\\mathbf{s}_1$ and $\\mathbf{s}_3$, one unit apart.'},

{t:'h2', num:'3.5', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Orthonormal set','$\\int\\psi_j\\psi_k\\,dt=1$ if $j=k$, else $0$','PS CH8.1'],
 ['Coordinates','$s_{ij}=\\int s_i\\psi_j\\,dt$','PS CH8.1'],
 ['Inner product survives','$\\int xy\\,dt=\\sum_k x_ky_k$','PS CH8.1'],
 ['Energy','$E_i=\\|\\mathbf{s}_i\\|^{2}$','PS CH8.1'],
 ['Distance','$\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=$ energy of the difference','PS CH8.1'],
 ['Gram–Schmidt','$g_k=s_k-\\sum_{i<k}s_{ki}\\psi_i$, and $\\psi_k=g_k/\\sqrt{E_{g_k}}$','PS CH8.1']
]},
{t:'p', text:'Chapter 4 builds the receiver for this constellation. It calculates the received coordinates and selects the nearest point. The error probability then depends on the distances between signal points.'}

];
})();
