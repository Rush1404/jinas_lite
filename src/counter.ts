export function setupCounter(element: HTMLButtonElement) {
  let counter = 100000000000000000000000000000000000000000000000000
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 100000))
  setCounter(0)
}
