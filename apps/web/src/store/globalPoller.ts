import { ref } from 'vue';

import { defineStore } from 'pinia';

export type PollTask = () => Promise<unknown> | unknown;

export const useGlobalPollerStore = defineStore('globalPoller', () => {
  const intervalMs = ref(10_000);
  const isRunning = ref(false);
  const tasks = ref<PollTask[]>([]);
  let timer: number | undefined;

  function setTasks(nextTasks: PollTask[]) {
    tasks.value = Array.isArray(nextTasks) ? [...nextTasks] : [];
  }

  function addTask(task: PollTask) {
    tasks.value.push(task);
  }

  function clearTasks() {
    tasks.value = [];
  }

  function start(nextTasks?: PollTask[], nextIntervalMs?: number) {
    if (typeof nextIntervalMs === 'number' && nextIntervalMs > 0)
      intervalMs.value = nextIntervalMs;
    if (nextTasks && nextTasks.length > 0) setTasks(nextTasks);
    if (isRunning.value) stop();
    isRunning.value = true;
    timer = window.setInterval(async () => {
      const current = [...tasks.value];
      if (current.length === 0) return;
      await Promise.allSettled(current.map((fn) => fn()));
    }, intervalMs.value);
  }

  function stop() {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
    isRunning.value = false;
  }

  // 供 Pinia 调用的重置方法
  function $reset() {
    stop();
    tasks.value = [];
    intervalMs.value = 10_000;
  }

  return {
    // state
    intervalMs,
    isRunning,
    tasks,

    // actions
    setTasks,
    addTask,
    clearTasks,
    start,
    stop,
    $reset,
    // 手动触发
    async tick() {
      const current = [...tasks.value];
      if (current.length === 0) return;
      await Promise.allSettled(current.map((fn) => fn()));
    },
  };
});
