import { BaseTranslate, ITranslateOptions } from "./translate";
const tencentcloud = require("tencentcloud-sdk-nodejs");
const TmtClient = tencentcloud.tmt.v20180321.Client;

const clientConfig = {
  credential: {
    secretId: "###############",
    secretKey: "###############",
  },
  region: "########",
  profile: {
    httpProfile: {
      endpoint: "tmt.tencentcloudapi.com",
    },
  },
};

const client = new TmtClient(clientConfig);

export class TMTTranslate extends BaseTranslate {
  private _requestErrorTime: number = 0;
  async _request(content: string): Promise<string> {
    const params = {
      SourceText: content,
      Source: 'auto',
      Target: 'zh',
      ProjectId: 0,
    };
    let res = await client.TextTranslate(params);
    return res.TargetText;
  }

  link(content: string, { to = "auto" }: ITranslateOptions): string {
    // [fix] 参数变化zh-cn -> zh-CN。
    let [first, last] = to.split("-");
    if (last) {
      last = last.toLocaleUpperCase();
      to = `${first}-${last}`;
    }
    let str = `https://translate.google.cn/#view=home&op=translate&sl=auto&tl=${to}&text=${encodeURIComponent(content)}`;
    return `[Google](${encodeURI(str)})`;
    // return `<a href="${encodeURI(str)}">Google</a>`;
  }

  async _translate(content: string): Promise<string> {
    let result = "";
    // 上一次失败的时间间隔小于5分钟，直接返回空
    if (Date.now() - this._requestErrorTime <= 2 * 1000) {
      return result;
    }
    try {
      result = await this._request(content);
      this._onTranslate.fire(`[TMT Translate]:\n${content}\n[<============================>]:\n${result}\n`);
    } catch (e) {
      this._requestErrorTime = Date.now();
      this._onTranslate.fire(`[TMT Translate]: request error\n ${JSON.stringify(e)} \n Try again in 5 minutes.`);
    }
    return result;
  }
}
