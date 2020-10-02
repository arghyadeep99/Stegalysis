$('button.encode, button.decode').click(function(event) {
  event.preventDefault();
});

function previewDecodeImage() {
  var file = document.querySelector('input[name=decodeFile]').files[0];

  $(".binary-decode").hide();

  previewImage(file, ".decode canvas", function() {
    $(".decode").fadeIn();
  });
}

function previewEncodeImage() {
  var file = document.querySelector("input[name=baseFile]").files[0];

  $(".images .nulled").hide();
  $(".images .message").hide();
  $(".binary").hide();

  previewImage(file, ".original canvas", function() {
    $(".images .original").fadeIn();
    $(".images").fadeIn();
  });
}

function previewImage(file, canvasSelector, callback) {
  var reader = new FileReader();
  var image = new Image;
  var $canvas = $(canvasSelector);
  var context = $canvas[0].getContext('2d');

  if (file) {
    reader.readAsDataURL(file);
  }

  reader.onloadend = function () {
    image.src = URL.createObjectURL(file);
    // console.log(image.src);

    image.onload = function() {
      
      canvasWidth = 0;
      canvasHeight = 0;

      if (image.width >= image.height) {
        if (image.width < 0.7*screen.availWidth) {
          canvasWidth = image.width;
          canvasHeight = image.height;
        } else {
          canvasWidth = 0.7*screen.availWidth;
          canvasHeight = (image.height*0.7*screen.availWidth)/image.width;
        }  
      } else {
        if (image.height < 0.7*screen.availHeight) {
          canvasWidth = image.width;
          canvasHeight = image.height;
        } else {
          canvasHeight = 0.7*screen.availHeight;
          canvasWidth = (image.width*0.7*screen.availHeight)/image.height;
        }  
      }

      $canvas.prop({
        'width': canvasWidth,
        'height': canvasHeight
      });

      context.drawImage(image, 0, 0, image.width, image.height,  // source rectangle
                               0, 0, canvasWidth, canvasHeight);  // destination rectangle

      callback();
    }
  }
}

let caesarCipher = (str, key) => {

  str = str.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0)-65 + key ) % 26 + 65));
  return str.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0)-97 + key ) % 26 + 97));

}

let isValid = (char) => {
  return char >= 32 && char <= 126;
}

function encodeMessage() {
  $(".error").hide();
  $(".binary").hide();

  var text = $("textarea.message").val();
  text = caesarCipher(text, 5);
  var cipherRegion = $('.cipher-message')[0];
  // console.log(cipherRegion);
  // console.log(text);
  cipherRegion.value = text;

  var $originalCanvas = $('.original canvas');
  var $nulledCanvas = $('.nulled canvas');
  var $messageCanvas = $('.message canvas');

  var originalContext = $originalCanvas[0].getContext("2d");
  var nulledContext = $nulledCanvas[0].getContext("2d");
  var messageContext = $messageCanvas[0].getContext("2d");

  var width = $originalCanvas[0].width;
  var height = $originalCanvas[0].height;

  // Check if the image is big enough to hide the message
  if ((text.length * 8) > (width * height * 3)) {
    $(".error")
      .text("Text too long for chosen image....")
      .fadeIn();

    return;
  }

  $nulledCanvas.prop({
    'width': width,
    'height': height
  });

  $messageCanvas.prop({
    'width': width,
    'height': height
  });

  // Normalize the original image and draw it
  // data = 1 2 3 255 4 5 6 255

  var original = originalContext.getImageData(0, 0, width, height);
  var pixel = original.data;
  for (var i = 0, n = pixel.length; i < n; i += 4) {
    for (var offset =0; offset < 3; offset ++) {
      if(pixel[i + offset] %2 != 0) {
        pixel[i + offset]--;
      }
    }
  }
  nulledContext.putImageData(original, 0, 0);

  // Convert the message to a binary string
  var binaryMessage = "";
  for (i = 0; i < text.length; i++) {
    // a => unicode => int => string (binary)

    var binaryChar = text[i].charCodeAt(0).toString(2);

    // Pad with 0 until the binaryChar has a lenght of 8 (1 Byte)
    while(binaryChar.length < 8) {
      binaryChar = "0" + binaryChar;
    }

    binaryMessage += binaryChar;
  }
  $('.binary textarea').text(binaryMessage);

  // Apply the binary string to the image and draw it
  // 40 length ka binary string
  var message = nulledContext.getImageData(0, 0, width, height);
  pixel = message.data;
  counter = 0;
  for (var i = 0, n = pixel.length; i < n; i += 4) {
    for (var offset =0; offset < 3; offset ++) {
      if (counter < binaryMessage.length) {
        pixel[i + offset] += parseInt(binaryMessage[counter]);
        counter++;
      }
      else {
        break;
      }
    }
  }
  messageContext.putImageData(message, 0, 0);

  $(".binary").fadeIn();
  $(".images .nulled").fadeIn();
  $(".images .message").fadeIn();
};

function decodeMessage() {
  var $originalCanvas = $('.decode canvas');
  var originalContext = $originalCanvas[0].getContext("2d");

  var original = originalContext.getImageData(0, 0, $originalCanvas.width(), $originalCanvas.height());
  var binaryMessage = "";
  var output = "";
  var pixel = original.data;
  var stop = false;
  for (var i = 0, n = pixel.length; i < n; i += 4) {
    if (!stop) {
      for (var offset =0; offset < 3; offset ++) {
        var value = 0;
        if(pixel[i + offset] %2 != 0) {
          value = 1;
        }
  
        binaryMessage += value;
        if (binaryMessage.length == 8) {
          charAscii = parseInt(binaryMessage, 2);
          if (isValid(charAscii)) {
            output += String.fromCharCode(charAscii);
            binaryMessage = "";
          }
          else {
            stop = true;
            break;
          }
        }
      }
    }
  }

  // for (var i = 0; i < binaryMessage.length; i += 8) {
  //   var c = 0;
  //   for (var j = 0; j < 8; j++) {
  //     c <<= 1;
  //     c |= parseInt(binaryMessage[i + j]);
  //   }

  //   output += String.fromCharCode(c);
  // }

  $('.binary-decode textarea')[0].value = output;
  $('.binary-decode input')[0].value = caesarCipher(output, 21);
  $('.binary-decode').fadeIn();

};