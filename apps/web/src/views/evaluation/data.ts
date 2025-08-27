// 测评场景
export type EvaluationScene = {
  disabled: boolean;
  evaluation: {
    description: string;
    id: number;
    link: string;
    name: string;
  };
  icon: string;
  id: string;
  introDesc: string;
  name: string;
  order: number;
  position: { bottom?: string; left?: string; right?: string; top?: string };
  teacherBubble: {
    description: string;
    name: string;
  };
  time: number;
  type: 'activity' | 'gym' | 'library' | 'teaching';
};

export const EVALUATION_SCENES: EvaluationScene[] = [
  {
    id: 'gym',
    name: '体育馆',
    type: 'gym',
    icon: '⚽',
    order: 1,
    position: { left: '24%', top: '28%' },
    disabled: false,
    introDesc: '你将会需要回答成长过程中的经历和自身身体发育方面的情况',
    teacherBubble: {
      name: '体育老师',
      description:
        '欢迎来到我们的快乐体育馆！在这里，我们要做一些简单的问答，就像玩游戏一样。' +
        '你的回答会帮助我们更好地了解你，看看你身体有多棒，心情有多美丽！' +
        '请挑选最贴近你真实情况的选项，就像挑选你最喜欢的颜色或玩具一样。' +
        '别担心，一切都是为了让我们能给你更多的帮助和快乐！',
    },
    time: 5,
    evaluation: {
      id: 12,
      name: '体能测评',
      description: '测试身体协调性和运动能力',
      link: ' http://192.168.5.23:8080/render/rrvObpEj?t=1756258732406',
    },
  },
  {
    id: 'library',
    name: '图书馆',
    type: 'library',
    icon: '📖',
    order: 2,
    position: { right: '33%', top: '24%' },
    disabled: false,
    evaluation: {
      id: 10,
      name: '阅读理解能力',
      description: '评估阅读理解和分析能力',
      link: 'http://192.168.5.23:8080/render/UHprKVMV?t=1756258744669',
    },
    introDesc: '你将会需要思考你是如何看待你自己的',
    teacherBubble: {
      name: '图书馆老师',
      description:
        '欢迎来到充满魔法的图书馆！在这个角落里，我们准备了许多有趣的问题，都是关于你如何看待自己的。就像在镜子里看自己一样，我们想知道你眼中的你是什么样的。这些问题就像是我们的小秘密，它们会帮助我们更深入地了解你的想法和感受。为了让我们能更好地理解你，给你最合适的帮助，就像选择你最喜欢的故事书一样，挑出那些最贴近你真实感受的答案吧！',
    },
    time: 15,
  },
  {
    id: 'act',
    type: 'activity',
    name: '活动室',
    icon: '🎨',
    order: 3,
    position: { right: '26%', bottom: '30%' },
    disabled: false,
    introDesc: '你将会需要回答关于电子游戏的问题',
    teacherBubble: {
      name: '活动室老师',
      description:
        '欢迎来到让人快乐的活动室！在这个小模块里，我们想和大家聊聊关于电子游戏的趣事。你可能有时会玩一些有趣的电子游戏，对吧？现在，我们要问你一些问题，关于你玩游戏的情况。记住哦，这里没有对错之分，就像你在学校里画画或唱歌一样，每个答案都是独特的。选择最接近你实际情况的选项，这样我们就能更好地了解你。 我们会用这些信息来做一些有趣的分析，看看是否需要给你一些关于游戏的小建议，或者帮助你更好地享受游戏的乐趣。',
    },
    time: 3,
    evaluation: {
      id: 13,
      name: '社交能力测评',
      description: '评估人际交往能力',
      link: 'http://192.168.5.23:8080/render/BWnQlCSz?t=1756258717791',
    },
  },
  {
    id: 'dorm',
    type: 'teaching',
    name: '宿舍楼',
    icon: '🎓',
    order: 4,
    position: { right: '20%', top: '35%' },
    introDesc: '你将会需要回答关于过去1个月睡眠与作息的问题',
    teacherBubble: {
      name: '教学老师',
      description:
        '欢迎来到神奇教学楼！在这里，我们相信每个同学都能像小超人一样，拥有满满的能量和快乐的心情。你知道吗？每天按时睡觉和起床，可以帮助我们保持这种超级能量哦！它不仅能让我们的身体感觉棒棒的，还能让我们的心情变得很好。我们想知道你的作息是怎样的，这样我们就能更好地了解你的心情和睡眠情况。 所以，当你回答问题时，请选择最贴近你实际情况的选项哦！',
    },
    time: 5,
    disabled: false,
    evaluation: {
      id: 11,
      name: '学习能力测评',
      description: '评估学习方法和效率',
      link: 'http://192.168.5.23:8080/render/zkBhlefz?t=1756258685606',
    },
  },
];
