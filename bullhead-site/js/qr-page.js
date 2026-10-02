function make(){var o=document.getElementById('out');o.innerHTML='';var n=+document.getElementById('n').value||1;
for(var i=1;i<=n;i++){var d=document.createElement('div');d.className='p';d.innerHTML='<div><h1>Bullhead</h1><h2>Order from your seat</h2><small>Agiza ukiwa umekaa</small></div><div><small>TABLE · MEZA</small><div class="tn">'+i+'</div></div><div class="q"></div><small>Scan · open the menu · tap send.<br>Skani · fungua menyu · tuma.</small>';
o.appendChild(d);new QRCode(d.querySelector('.q'),{text:location.origin+'/menu?table='+i,width:300,height:300,correctLevel:QRCode.CorrectLevel.M})}}
document.getElementById('mk').onclick=make;document.getElementById('pr').onclick=function(){window.print()};make();
