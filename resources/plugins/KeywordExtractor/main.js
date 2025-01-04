// main.js

// 替换为您的 API Key 和 Secret Key
const API_KEY = "NHDr47qNcWCGE19ygnDCWrOl";
const SECRET_KEY = "3pVllYub07XKMvEEzmqBTyQS5raWzFef";

// 获取 Access Token 的函数
async function getAccessToken(apiKey, secretKey) {
  const url = "https://aip.baidubce.com/oauth/2.0/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", apiKey);
  params.append("client_secret", secretKey);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`获取 Access Token 失败: ${data.error_description}`);
    }

    return data.access_token;
  } catch (error) {
    console.error("获取 Access Token 出错:", error.message);
    throw error;
  }
}

// 发送关键词提取请求的函数
async function extractKeywords(accessToken, textArray, num) {
  // 正确的关键词提取 API 地址
  const url = `https://aip.baidubce.com/rpc/2.0/nlp/v1/txt_keywords_extraction?access_token=${accessToken}`;

  // 请求体
  const requestBody = {
    text: textArray, // 文本内容数组
    num: num, // 最大关键词数量
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.error_code) {
      throw new Error(`API 调用失败: ${data.error_msg}`);
    }

    return data.results; // 返回提取到的关键词结果
  } catch (error) {
    console.error("关键词提取 API 出错:", error.message);
    throw error;
  }
}

// 主流程
async function main() {
  try {
    // 获取 Access Token
    const accessToken = await getAccessToken(API_KEY, SECRET_KEY);
    console.log("成功获取 Access Token:", accessToken);

    // 调用关键词提取 API
    const textArray = [
      "学习书法，就选唐颜真卿《颜勤礼碑》原碑与对临「第1节」",
    ]; // 示例文本
    const num = 4; // 提取关键词的最大数量
    const keywords = await extractKeywords(accessToken, textArray, num);

    console.log("提取的关键词结果:");
    keywords.forEach((item, index) => {
      console.log(`${index + 1}. 关键词: ${item.word}, 置信度: ${item.score}`);
    });
  } catch (error) {
    console.error("流程执行出错:", error.message);
  }
}

// 执行主流程
main();
