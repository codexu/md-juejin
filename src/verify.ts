// 处理滑块逻辑
import { Page, Frame } from 'playwright'

export async function verify(page: Page) {
  // 等待 .vc_captcha_wrapper 下的 iframe 加载完成
  await page.waitForSelector('iframe', { timeout: 3000 });
  // 获取 iframe
  const elementHandle = await page.$('iframe');
  // 获取 iframe 的 contentWindow
  const frame = await elementHandle?.contentFrame();
  if (!frame) return
  try {
    await handleDrag(page, frame);
  } catch (error) {
    return;
  }
}

async function handleDrag(page: Page, frame: Frame) {
  function easeOutBounce(t: number, b: number, c: number, d: number) {
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t) + b;
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
    }
  }
  // 在浏览器中执行代码，获取图片，创建canvas
  const coordinateShift = await getCaptchaX(frame);
  if (coordinateShift) {
    await frame.waitForSelector('.captcha-slider-btn');
    const drag = await frame.$('.captcha-slider-btn');
    if (!drag) return
    const dragBox = await drag.boundingBox();
    if (!dragBox) return
    const dragX = dragBox.x + dragBox.width / 2;
    const dragY = dragBox.y + dragBox.height / 2;

    await page.mouse.move(dragX, dragY);
    await page.mouse.down();
    await page.waitForTimeout(300);

    // 定义每个步骤的时间和总时间
    const totalSteps = 100;
    const stepTime = 5;

    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps; // 当前步骤占总时间的比例
      const easeT = easeOutBounce(t, 0, 1, 1); // 使用easeOutBounce函数计算当前位置占总距离的比例

      const newX = dragX + coordinateShift * easeT - 5;
      const newY = dragY + Math.random() * 10;

      await page.mouse.move(newX, newY, { steps: 1 });
      await page.waitForTimeout(stepTime);
    }

    await page.waitForTimeout(800);
    await page.mouse.up();
  }
  try {
    // 等待页面跳转
    await page.waitForNavigation();
  } catch (error) {
    throw new Error('登录失败');
  }
}

// 计算滑块缺口X轴位置
async function getCaptchaX(frame: Frame) {
  await frame.waitForSelector('#captcha_verify_image');
  const coordinateShift = await frame.evaluate(async () => {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });
    const image = document.querySelector(
      '.verify-image>#captcha_verify_image',
    ) as HTMLImageElement;
    // 创建一个画布，将 image 转换成canvas
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return 0;
    }
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    // 将像素数据转换为二维数组，处理灰度、二值化，将像素点转换为0（黑色）或1（白色）
    const data: number[][] = [];
    for (let h = 0; h < image.height; h++) {
      data.push([]);
      for (let w = 0; w < image.width; w++) {
        const index = (h * image.width + w) * 4;
        const r = imageData.data[index] * 0.2126;
        const g = imageData.data[index + 1] * 0.7152;
        const b = imageData.data[index + 2] * 0.0722;
        if (r + g + b > 120) {
          data[h].push(1);
        } else {
          data[h].push(0);
        }
      }
    }
    // 通过 data 0 黑色 或 1 白色 的值，绘制到 canvas 上，查看效果
    for (let h = 0; h < image.height; h++) {
      for (let w = 0; w < image.width; w++) {
        ctx.fillStyle = data[h][w] == 1 ? '#fff' : '#000';
        ctx.fillRect(w, h, 1, 1);
      }
    }
    image.src = canvas.toDataURL();
    // 获取缺口图像
    const captchaVerifyImage = document.querySelector(
      '#captcha-verify_img_slide',
    ) as HTMLImageElement;
    // 创建一个画布，将 image 转换成canvas
    const captchaCanvas = document.createElement('canvas');
    captchaCanvas.width = captchaVerifyImage.width;
    captchaCanvas.height = captchaVerifyImage.height;
    const captchaCtx = captchaCanvas.getContext('2d');
    if (!captchaCtx) {
      return 0;
    }
    captchaCtx.drawImage(
      captchaVerifyImage,
      0,
      0,
      captchaVerifyImage.width,
      captchaVerifyImage.height,
    );
    const captchaImageData = captchaCtx?.getImageData(
      0,
      0,
      captchaVerifyImage.width,
      captchaVerifyImage.height,
    );
    // 将像素数据转换为二维数组，同样处理灰度、二值化，将像素点转换为0（黑色）或1（白色）
    const captchaData: number[][] = [];
    for (let h = 0; h < captchaVerifyImage.height; h++) {
      captchaData.push([]);
      for (let w = 0; w < captchaVerifyImage.width; w++) {
        const index = (h * captchaVerifyImage.width + w) * 4;
        const r = captchaImageData.data[index] * 0.2126;
        const g = captchaImageData.data[index + 1] * 0.7152;
        const b = captchaImageData.data[index + 2] * 0.0722;
        if (r + g + b > 30) {
          captchaData[h].push(0);
        } else {
          captchaData[h].push(1);
        }
      }
    }
    // 通过 captchaData 0 黑色 或 1 白色 的值，绘制到 canvas 上，查看效果
    for (let h = 0; h < captchaVerifyImage.height; h++) {
      for (let w = 0; w < captchaVerifyImage.width; w++) {
        captchaCtx.fillStyle =
          captchaData[h][w] == 1 ? 'rgba(0,0,0,0)' : 'black';
        captchaCtx.fillRect(w, h, 1, 1);
      }
    }
    captchaVerifyImage.src = captchaCanvas.toDataURL();
    // 获取captchaVerifyImage 相对于 .verify-image 的偏移量
    const captchaVerifyImageBox = captchaVerifyImage.getBoundingClientRect();
    const captchaVerifyImageTop = captchaVerifyImageBox.top;
    // 获取缺口图像的位置
    const imageBox = image.getBoundingClientRect();
    const imageTop = imageBox.top;
    // 计算缺口图像的位置，top 向上取整，bottom 向下取整
    const top = Math.floor(captchaVerifyImageTop - imageTop);
    // data 截取从 top 列到 top + image.height 列的数据
    const sliceData = data.slice(top, top + image.height);
    // 循环对比 captchaData 和 sliceData，从左到右，每次增加一列，返回校验相同的数量
    const equalPoints = [];
    // 从左到右，每次增加一列
    for (let leftIndex = 0; leftIndex < sliceData[0].length; leftIndex++) {
      let equalPoint = 0;
      // 新数组 sliceData 截取 leftIndex - leftIndex + captchaVerifyImage.width 列的数据
      const compareSliceData = sliceData.map((item) =>
        item.slice(leftIndex, leftIndex + captchaVerifyImage.width),
      );
      // 循环判断 captchaData 和 compareSliceData 相同值的数量
      for (let h = 0; h < captchaData.length; h++) {
        for (let w = 0; w < captchaData[h].length; w++) {
          if (captchaData[h][w] === compareSliceData[h][w]) {
            equalPoint++;
          }
        }
      }
      equalPoints.push(equalPoint);
    }
    // 找到最大的相同数量，大概率为缺口位置
    return equalPoints.indexOf(Math.max(...equalPoints));
  });
  return coordinateShift + 3;
}