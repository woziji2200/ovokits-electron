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

// 发送文本纠错请求的函数
async function correctText(accessToken, text) {
  const url = `https://aip.baidubce.com/rpc/2.0/nlp/v2/text_correction?access_token=${accessToken}`;

  const requestBody = {
    text: text,
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
      throw new Error(`文本纠错 API 调用失败: ${data.error_msg}`);
    }

    return data.item; // 返回纠正后的文本和详细信息
  } catch (error) {
    console.error("文本纠错 API 出错:", error.message);
    throw error;
  }
}

// 主流程
async function main() {
  try {
    // 获取 Access Token
    const accessToken = await getAccessToken(API_KEY, SECRET_KEY);
    console.log("成功获取 Access Token:", accessToken);

    // 调用文本纠错 API
    const textToCorrect = "实现祖国完全统一，是全体中华儿女共同愿望，解决台湾问题，是中华民族根本利益所在。推动两岸关系和平发展，必须继续坚持“和平统一、一郭两制”方针，退进祖国和平统一。"; // 示例文本
    const correctionResult = await correctText(accessToken, textToCorrect);

    console.log("纠正后的文本:", correctionResult.correct_query);
    console.log("纠错详情:");
    correctionResult.details.forEach((item, index) => {
      console.log(`${index + 1}. 句子: ${item.sentence}`);
      console.log(`   纠正后的句子: ${item.sentence_fixed}`);
      item.vec_fragment.forEach((frag, fragIndex) => {
        console.log(`     - 错误片段: ${frag.ori_frag}`);
        console.log(`       建议修改为: ${frag.correct_frag}`);
        console.log(`       纠错类型: ${frag.label}`);
        console.log(`       纠错解释: ${frag.explain}`);
      });
    });

  } catch (error) {
    console.error("流程执行出错:", error.message);
  }
}

// 执行主流程
main();
