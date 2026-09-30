import terms from "./terms.zh-CN.json" with { type: "json" };
import type { SystemId } from "../../app/core/anatomy";
const normalizedTerms = new Map(
  Object.entries(terms).map(([english, chinese]) => [english.toLowerCase(), chinese]),
);

export type Locale = "zh-CN" | "en";
export const LANGUAGE_STORAGE_KEY = "human-atlas.language";
export const UI_ZH: Record<string, string> = {
  "INTERACTIVE ANATOMY": "交互式人体解剖",
  "modeled pieces": "个模型零件",
  "Explorer panels": "浏览面板",
  "Search anatomy": "搜索解剖结构",
  "Find a structure": "查找结构",
  "About this atlas": "关于此图谱",
  "Anatomical layers": "解剖图层",
  Systems: "系统",
  "Close systems": "关闭系统面板",
  All: "全部",
  Skeleton: "骨骼",
  Organs: "器官",
  "Show only {name}": "仅显示{name}",
  "Show {name}": "显示{name}",
  "{count} pieces visible": "已显示 {count} 个零件",
  "Hide all": "全部隐藏",
  "Close search": "关闭搜索",
  "Heart, femur, cranial nerve…": "心脏、股骨、脑神经…",
  "Search named anatomical structures": "搜索有名称的解剖结构",
  "No structures match your search.": "没有找到匹配的结构。",
  piece: "个零件",
  pieces: "个零件",
  "Showing up to 80 matches. Refine your search to find smaller structures.":
    "最多显示 80 项结果；补充关键词可查找更具体的结构。",
  "Start with a major organ, or search every named structure.":
    "可从主要器官开始，也可输入中文、英文名称或源 ID。",
  "Camera controls": "相机控制",
  "three-quarter view": "四分之三视角",
  "front view": "正面视角",
  "side view": "侧面视角",
  "back view": "背面视角",
  "Pause rotation": "暂停旋转",
  "Rotate body": "旋转人体",
  "Auto rotate": "自动旋转",
  "Reset view and layers": "重置视角和图层",
  "SELECTED STRUCTURE": "选中结构",
  "ANATOMICAL INVENTORY": "解剖零件总览",
  "SEPARATED STRUCTURES": "分离结构",
  "ADULT HUMAN · MALE": "成年人体 · 男性",
  "Open system layers": "打开系统图层",
  "Explode anatomy": "分解解剖结构",
  Assembled: "完整组装",
  "Every piece": "全部零件",
  "Assemble and reset": "组装并重置",
  Reset: "重置",
  "Drag to pan": "拖动平移",
  "Drag to orbit": "拖动旋转",
  "Pinch to zoom": "双指缩放",
  "Tap to inspect": "点击查看",
  "Source & credits": "来源与署名",
  "Preparing the anatomy": "正在准备解剖模型",
  "Loading {count} pieces": "正在加载 {count} 个零件",
  "Reload viewer": "重新加载",
  ANATOMY: "解剖结构",
  "System overview · structure identified from source anatomy":
    "系统概述 · 结构名称来自原始解剖数据",
  "Atlas reference": "图谱源 ID",
  "Selected pieces": "选中零件",
  "Included structures": "包含的结构",
  "And {count} more modeled pieces.": "另有 {count} 个模型零件。",
  "View anatomical source": "查看解剖数据来源",
  "Show surrounding anatomy": "显示周围结构",
  "Isolate structure": "单独查看结构",
  "Clear selection": "取消选择",
  "SOURCE & SCOPE": "来源与范围",
  "A body, revealed.": "探索人体的内部结构",
  "Explore the adult male reference anatomy from BodyParts3D.":
    "探索 BodyParts3D 成年男性参考解剖模型。",
  "Male · BodyParts3D": "男性 · BodyParts3D",
  "2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.":
    "包含成年男性参考解剖模型的 2,234 个独立网格和 3,432 个具名概念。",
  "This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.":
    "本参考模型并未包含所有人体结构或个体差异。一个具名概念可能包含多个零件；每个源网格仅渲染一次。",
  "Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.":
    "颜色和系统分组用于辅助探索。几何数据经过简化，简短说明提供一般教学背景。本应用为解剖参考图谱，不用于诊断或手术。",
  Source: "数据来源",
  "Dataset license": "数据集许可",
  "Original geometry & metadata": "原始几何与元数据",
  "Read the source publication": "阅读原始研究论文",
  "Chinese terminology draft": "中文术语初稿",
  "Chinese names are an offline terminology draft and have not been professionally reviewed. English source names and identifiers are preserved for comparison.":
    "中文名称为离线术语初稿，尚未经过专业审校。保留英文源名称和标识符供对照及后续修订。",
  "Offline client": "离线客户端",
  "Web viewer": "网页查看器",
  Language: "语言",
  Close: "关闭",
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.":
    "BodyParts3D，© 生命科学数据库中心，依据 CC BY 4.0 国际许可授权。",
  "Application code: MIT. Anatomy data: CC BY 4.0.": "应用代码：MIT。解剖数据：CC BY 4.0。",
  "Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.":
    "交互式人体解剖。拖动旋转，双指或滚轮缩放，点击结构查看详情。",
  "This browser could not start the 3D viewer. Please try a browser with WebGL enabled.":
    "无法启动三维查看器，请确认显卡驱动及 WebGL 支持正常。",
  "An anatomy file could not be loaded.": "无法加载解剖模型文件。",
  "An anatomy file was incomplete. Please reload the viewer.":
    "解剖模型文件不完整，请重新加载查看器。",
  "The anatomy catalogue could not be loaded.": "无法加载解剖模型目录。",
  "Could not assemble anatomy geometry.": "无法组装解剖模型几何数据。",
  "Could not load the anatomy.": "无法加载解剖模型。",
  "The 3D session was paused by your device. Reload to continue.":
    "设备暂停了三维会话，请重新加载后继续。",
  "The anatomy could not be loaded. Please reload the viewer.":
    "无法加载解剖模型，请重新加载查看器。",
  "Could not open this link.": "无法打开链接，请稍后重试。",
};

const SYSTEM_ZH: Record<SystemId, { name: string; description: string }> = {
  skeletal: {
    name: "骨骼",
    description:
      "骨构成人体的支撑框架，保护器官并为肌肉提供附着点。骨内组织还可储存矿物质并产生血细胞。",
  },
  muscular: {
    name: "肌肉",
    description: "骨骼肌通过牵拉附着点产生运动，并与肌腱共同驱动关节、稳定姿势和产生热量。",
  },
  cardiac: {
    name: "心脏",
    description: "心脏是具有四个腔室的肌性泵。心脏瓣膜引导血液沿肺循环和体循环向前流动。",
  },
  sensory: {
    name: "感觉器官",
    description:
      "这些结构参与视觉、听觉和平衡等特殊感觉。其特化组织感受刺激，并与神经系统共同传递信息。",
  },
  arterial: {
    name: "动脉",
    description: "心脏驱动血液循环。动脉将血液从心脏输送到组织，或在肺循环中输送到肺。",
  },
  venous: {
    name: "静脉",
    description: "静脉将血液送回心脏。浅、深静脉网络收集组织中的血液；肺静脉将含氧血从肺送回心脏。",
  },
  nervous: {
    name: "神经系统",
    description: "脑、脊髓和周围神经传递并处理信号，支持感觉、运动、协调和身体功能的自主调节。",
  },
  respiratory: {
    name: "呼吸系统",
    description:
      "气道将空气输送到肺，氧气和二氧化碳在空气与血液间交换。呼吸依赖呼吸肌产生的压力变化。",
  },
  digestive: {
    name: "消化系统",
    description: "消化道分解食物，吸收营养和水分，并向后输送废物。附属器官提供胆汁和消化酶。",
  },
  urinary: {
    name: "泌尿系统",
    description: "肾过滤血液并调节体液、电解质和酸碱平衡。尿液经输尿管进入膀胱，并通过尿道排出。",
  },
  lymphatic: {
    name: "淋巴系统",
    description: "淋巴管将多余的组织液送回血液循环。淋巴结及其他淋巴器官参与免疫监视和免疫反应。",
  },
  endocrine: {
    name: "内分泌系统",
    description: "内分泌器官向血液释放激素，协调代谢、生长、应激反应和生殖等过程。",
  },
  reproductive: {
    name: "生殖系统",
    description: "本模型中的男性生殖结构参与精子的生成、成熟和输送，并产生性激素。",
  },
  integumentary: {
    name: "体表",
    description: "体表提供外部解剖参考。皮肤系统形成保护屏障，并参与感觉和体温调节。",
  },
  connective: {
    name: "结缔组织",
    description: "软骨、韧带及其他结缔组织支撑、连接并分隔结构，参与稳定关节和分散机械负荷。",
  },
};
const EXPLANATION_ZH: Record<string, string> = {
  heart: "位于胸部的肌性泵。右心将血液输送到肺，左心通过体循环将血液输送到全身。",
  liver: "位于膈右侧下方的大型器官，处理吸收的营养物质、产生胆汁，并合成血液中的多种蛋白质。",
  brain: "神经系统的中枢器官。相互连接的脑区支持感知、运动、记忆、语言及身体功能调节。",
  stomach: "位于食管与小肠之间的肌性腔室。储存食物，将食物与胃酸和消化酶混合，再送入十二指肠。",
  spleen: "位于左上腹的淋巴器官。过滤血液，清除衰老血细胞，并参与免疫反应。",
  pancreas: "兼有消化和内分泌作用的腹部器官。向小肠提供消化酶，释放胰岛素和胰高血糖素等激素。",
  "urinary bladder": "位于盆腔的肌性储尿器官，储存由输尿管输送而来的尿液。",
  trachea: "连接喉和支气管的主要气道，软骨支架有助于维持气道开放。",
  diaphragm: "分隔胸腔与腹腔的宽大肌肉。收缩时增加胸腔容积，帮助空气进入肺。",
};

export function text(
  english: string,
  locale: Locale,
  values: Record<string, string | number> = {},
) {
  const template = locale === "zh-CN" ? (UI_ZH[english] ?? english) : english;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}
export function displayName(english: string, locale: Locale) {
  return locale === "zh-CN"
    ? ((terms as Record<string, string>)[english] ??
        normalizedTerms.get(english.toLowerCase()) ??
        english)
    : english;
}
export function searchText(english: string, id: string) {
  return `${english}\n${displayName(english, "zh-CN")}\n${id}`.toLowerCase();
}
export function systemName(id: SystemId, english: string, locale: Locale) {
  return locale === "zh-CN" ? SYSTEM_ZH[id].name : english;
}
export function chineseExplanation(name: string, system: SystemId) {
  return EXPLANATION_ZH[name.toLowerCase()] ?? SYSTEM_ZH[system].description;
}
export function readLocale(storage?: Pick<Storage, "getItem">): Locale {
  try {
    return storage?.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh-CN";
  } catch {
    return "zh-CN";
  }
}
export function errorText(error: string, locale: Locale) {
  return text(
    UI_ZH[error] ? error : "The anatomy could not be loaded. Please reload the viewer.",
    locale,
  );
}
