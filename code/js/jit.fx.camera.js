inlets = 1;
outlettypes = ["jit_gl_texture"];

include("jit.fx.include.js");

var inTex = new JitterObject("jit.gl.texture", drawto);
inTex.rectangle = 0;
inTex.type = "float16";
fxobs.push(inTex);

var prevUvTex = new JitterObject("jit.gl.texture", drawto);
prevUvTex.rectangle = 0;
prevUvTex.type = "float16";
fxobs.push(prevUvTex);

//var fdbkTex = new JitterObject("jit.gl.texture", drawto);
fdbkTex.rectangle = 1;
fdbkTex.adapt = 0;
//fxobs.push(fdbkTex);

slab.file = "jit.fx.camera.jxs";
slab.inputs = 1;
slab.outputs = 2;
slab.rectangle = 0;
fxobs.push(slab);

var slab_uvdiff = new JitterObject("jit.gl.slab", drawto);
slab_uvdiff.file = "jit.fx.camera.uvdiff.jxs";
slab_uvdiff.inputs = 2;
slab_uvdiff.outputs = 1;
slab_uvdiff.type = "float16";
fxobs.push(slab_uvdiff);

var slab_blur = new JitterObject("jit.gl.slab", drawto);
slab_blur.file = "jit.fx.camera.blur.jxs";
slab_blur.inputs = 2;
slab_blur.outputs = 1;
slab_blur.type = "float16";
fxobs.push(slab_blur);

var zoom = 0.0;
declareattribute("zoom", null, "setzoom", 0);
function setzoom(v){ 
	zoom = v;
	slab.param("zoom", Math.pow(2, zoom));
}

var boundmode = 0;
declareattribute("boundmode", null, "setboundmode", 0);
function setboundmode(v){ 
	boundmode = Math.max(0, Math.min(4, v));
	switch (boundmode) {
	  case 0:
	    inTex.wrap = "clamp";
	    break;
	  case 1:
	    inTex.wrap = "repeat";
	    break;
	  case 2:
	    inTex.wrap = "clampedge";
	    break;
	  case 3:
	    inTex.wrap = "clampborder";
	    break;
	  case 4:
	    inTex.wrap = "mirroredrepeat";
	    break;
	}
}
setboundmode(boundmode);

var blur_amount = 1.0;
declareattribute("blur_amount", null, "setblur_amount", 0);
function setblur_amount(v){ 
	blur_amount = v;
}

var tilt = 0.0;
declareattribute("tilt", null, "settilt", 0);
function settilt(v){ 
	tilt = v;
	slab.param("costilt", Math.cos(tilt));
	slab.param("sintilt", Math.sin(tilt));
}

var lookat = [0,0];
declareattribute("lookat", null, "setlookat", 0);
function setlookat(){ 
	lookat = [arguments[0], arguments[1]];
	slab.param("lookat", lookat);
}

let tile = new Array(2);
let amt;

function drawfx(inname){

	inTex.jit_gl_texture(inname);
	fdbkTex.dim = inTex.dim;

	slab.jit_gl_texture(inTex.name);
	slab.draw();

	if(blur_amount <= 0.0){
		outlet(0, "jit_gl_texture", slab.out_name[0]);
	} else {
		slab_uvdiff.activeinput = 1;
		slab_uvdiff.jit_gl_texture(prevUvTex.name);
		slab_uvdiff.activeinput = 0;
		slab_uvdiff.jit_gl_texture(slab.out_name[1]);
		slab_uvdiff.draw();

		prevUvTex.jit_gl_texture(slab.out_name[1]);

		fdbkTex.jit_gl_texture(slab.out_name[0]);

		slab_blur.activeinput = 1;
		slab_blur.jit_gl_texture(slab_uvdiff.out_name);
		slab_blur.activeinput = 0;

		amt = blur_amount*Math.pow(2, zoom)*0.1;
		
		for(let i = 0; i < 5; i++){

			tile[0] = 128 * (i % 8);
			tile[1] = 128 * Math.floor(i / 8);
			slab_blur.param("tile", tile);
			slab_blur.param("blur_amount", amt);

			slab_blur.jit_gl_texture(fdbkTex.name);
			slab_blur.draw();

			fdbkTex.jit_gl_texture(slab_blur.out_name);	
			amt *= 1.3333333333333333;	
		}

		outlet(0, "jit_gl_texture", fdbkTex.name);
	}
}