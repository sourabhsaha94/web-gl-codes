  class Color {
    constructor(r,g,b,a){
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }

    change(r,g,b,a){
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
  }

  function drawPixel(imagedata,x,y,color){
    try{
      if((x<0)||(y<0)||(x>=imagedata.width)||(y>=imagedata.height)){
        throw "drawpixel is out of bounds";
      }
      else if(color instanceof Color){
        var pixelindex = (y*imagedata.width+x)*4;
        imagedata.data[pixeldata] = color.r;
        imagedata.data[pixeldata+1]=color.g;
        imagedata.data[pixeldata+2]=color.b;
        imagedata.data[pixeldata+3]=color.a;
      }
      else{
        throw "drawpixel is not instance of COlor";
      }
    }
    catch(e){
      console.log(e);
    }
  }

  function main() {
    var canvas = document.getElementById('viewport');
    var context = canvas.getContext('2d');
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w,h);

    var c = new Color(0,255,0,255);
    for(var x=350;x<800;x++){
      for(var y=350;y<800;y++){
        drawPixel(imagedata,x,y,c);
      }
    }

    context.putImageData(imagedata,0,0);
  }
