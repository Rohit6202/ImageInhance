const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
let originalImage = null;

// Controls
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const saturation = document.getElementById('saturation');
const sharpness = document.getElementById('sharpness');
const imageInput = document.getElementById('imageInput');

// Value displays
const brightnessValue = document.getElementById('brightnessValue');
const contrastValue = document.getElementById('contrastValue');
const saturationValue = document.getElementById('saturationValue');
const sharpnessValue = document.getElementById('sharpnessValue');

// Event listeners
imageInput.addEventListener('change', loadImage);
brightness.addEventListener('input', updateImage);
contrast.addEventListener('input', updateImage);
saturation.addEventListener('input', updateImage);
sharpness.addEventListener('input', updateImage);
document.getElementById('resetBtn').addEventListener('click', resetControls);
document.getElementById('downloadBtn').addEventListener('click', downloadImage);

function loadImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage = new Image();
        originalImage.onload = function() {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            updateImage();
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
}

function applyFilters() {
    if (!originalImage) return;

    ctx.drawImage(originalImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness and contrast
    const brightnessFactor = brightness.value / 100;
    const contrastFactor = contrast.value / 100;
    const contrastOffset = 128 * (1 - contrastFactor);

    for (let i = 0; i < data.length; i += 4) {
        // Brightness
        data[i] = data[i] * brightnessFactor;
        data[i+1] = data[i+1] * brightnessFactor;
        data[i+2] = data[i+2] * brightnessFactor;

        // Contrast
        data[i] = data[i] * contrastFactor + contrastOffset;
        data[i+1] = data[i+1] * contrastFactor + contrastOffset;
        data[i+2] = data[i+2] * contrastFactor + contrastOffset;
    }

    // Apply saturation
    const saturationFactor = saturation.value / 100;
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.2989 * data[i] + 0.5870 * data[i+1] + 0.1140 * data[i+2];
        data[i] = gray + (data[i] - gray) * saturationFactor;
        data[i+1] = gray + (data[i+1] - gray) * saturationFactor;
        data[i+2] = gray + (data[i+2] - gray) * saturationFactor;
    }

    // Apply sharpness (simple convolution kernel)
    if (sharpness.value > 0) {
        const tempData = new Uint8ClampedArray(data);
        const kernel = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ];
        const kernelSize = 3;
        const half = Math.floor(kernelSize / 2);

        for (let y = half; y < canvas.height - half; y++) {
            for (let x = half; x < canvas.width - half; x++) {
                let r = 0, g = 0, b = 0;
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const idx = ((y + ky - half) * canvas.width + (x + kx - half)) * 4;
                        const weight = kernel[ky][kx] * sharpness.value/10;
                        r += tempData[idx] * weight;
                        g += tempData[idx+1] * weight;
                        b += tempData[idx+2] * weight;
                    }
                }
                const idx = (y * canvas.width + x) * 4;
                data[idx] = Math.min(255, Math.max(0, r));
                data[idx+1] = Math.min(255, Math.max(0, g));
                data[idx+2] = Math.min(255, Math.max(0, b));
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function updateImage() {
    brightnessValue.textContent = brightness.value;
    contrastValue.textContent = contrast.value;
    saturationValue.textContent = saturation.value;
    sharpnessValue.textContent = sharpness.value;
    applyFilters();
}

function resetControls() {
    brightness.value = 100;
    contrast.value = 100;
    saturation.value = 100;
    sharpness.value = 0;
    updateImage();
}

function downloadImage() {
    if (!originalImage) return;
    const link = document.createElement('a');
    link.download = 'enhanced-image.png';
    link.href = canvas.toDataURL();
    link.click();
}
