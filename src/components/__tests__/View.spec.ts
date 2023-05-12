import { ref } from 'vue';
import { describe, test, expect, vi, } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import View from '@/components/View.vue'

describe("View", () => {
  const viewText = "Hello from inside a view";

  test("render span correctly", async () => {
    const viewId = "viewId";
    const view = mount(View as any, { props: { element: 'span' }, attrs: { id: viewId }, slots: { default: viewText } })
    
    expect(view.exists()).toBeTruthy()
    expect(view.props('element')).toBe('span')
    expect(view.text()).toBe(viewText)
    expect(view.element.nodeName).toBe('SPAN')
    expect(view.vm.$emits).toBe(undefined)

  });
});


describe('Slot', () => {
  const Layout = {
    template: `
      <div>
        <header>
          <slot name="header" />
        </header>
  
        <main>
          <slot name="main" />
        </main>
        <footer>
          <slot name="footer" />
        </footer>
      </div>
    `
  }

  test('should slots exists', () => {
    const layout = mount(Layout, { slots: { header: 'Header', main: 'Main', footer: 'Footer'} })

    expect(layout.text()).toContain('Header')
    expect(layout.html()).toContain('Main')
    expect(layout.html()).toContain('Footer')
  })
})

// ------------------------------------------------------

describe('Transition', () => {
  const Transition = {
    setup() {
      const show = ref(false)
  
      return {
        show
      }
      },
    template: `
    <button @click="show = !show">Toggle</button>

    <transition name="fade">
      <p v-if="show">hello</p>
    </transition>
    `
  }

  test('works with transitions', async () => {
    const transition = mount(Transition)
    await transition.find('button').trigger('click')

    expect(transition.vm.show).toBeTruthy()
    expect(transition.html()).toContain('<p>hello</p>')
  })
})

describe('Component Instance', () => {
  test('asserts correct props are passed', () => {
    const Foo = {
      props: ['msg'],
      template: `<div>{{ msg }}</div>`
    }
  
    const Comp = {
      components: { Foo },
      template: `<div><Foo msg="hello world" /></div>`
    }
  
    const wrapper = mount(Comp)
  
    expect(wrapper.getComponent(Foo).vm.msg).toBe('hello world')
    expect(wrapper.getComponent(Foo).props()).toEqual({ msg: 'hello world' })
  })
})

// ------------------------------------------------------

describe('Testing v-model', () => {
  const MoneyEditor = {
    template: `<div> 
      <input :value="currency" id="currency" @input="$emit('update:currency', $event.target.value)"/>
      <input :value="modelValue" id="modelValue"  @input="$emit('update:modelValue', $event.target.value)"/>
    </div>`,
    props: ['currency', 'modelValue'],
    emits: ['update:currency', 'update:modelValue']
  }

  const wrapper = mount(MoneyEditor, {
    props: {
      modelValue: 'initialText',
      'onUpdate:modelValue': (e: string) => wrapper.setProps({ modelValue: e }),
      currency: '$',
      'onUpdate:currency': (e: string) => wrapper.setProps({ currency: e })
    }
  })

  const mock = [
    { id: 'modelValue', props: 'modelValue', expected: 'test' },
    { id: 'currency', props: 'currency', expected: '£' },
  ]

  test.each(mock)('modelValue %o', async (value) => {

    const input = wrapper.find(`#${value.id}`)
    await input.setValue(value.expected)

    expect(wrapper.props(value.props)).toBe(value.expected)

  })
})

// ---------------------------------------------------------

describe('Creating snapshot', () => {
  const HelloComponent = {
    template: `<div>Hello222322323</div>`
  }

  test('first snapshot', () => {
    const wrapper = mount(HelloComponent)
  
    expect(wrapper.text()).toMatchSnapshot()
  })

  const WorldComponent = {
    template: `<div>WorldComponent</div>`
  }

  test('first inline snapshot', () => {
    const wrapper = mount(WorldComponent)
  
    expect(wrapper.text()).toMatchInlineSnapshot('"WorldComponent"')
  })

})

// -----------------------------------------------------------

describe('Making HTTP requests', () => {

  const mockPostList = [
    { id: 1, title: 'check1' },
    { id: 2, title: 'chek2' }
  ]

  const Post = {
    template: `
    <button :disabled="loading" @click="getPosts">Get posts</button>

    <p v-if="loading" role="loading">Loading your posts…</p>
    <ul v-else>
      <li v-for="post in posts" :key="post.id" data-test="post">
        {{ post.title }}
      </li>
    </ul>
    `,
    setup() {
      const loading = ref(false)
      const posts = ref<any>([])
      const getPosts = async () => {
        loading.value = true
        posts.value = await fetch('/api/posts')
        loading.value = false
      }

      return {
        loading,
        posts,
        getPosts
      }
    }
  }
  const fetch = vi.fn((_: string) => Promise.resolve(mockPostList));

  test('Check Http Request', async () => {
    const wrapper = mount(Post)
    

    expect(wrapper.find('[role="loading"]').exists()).toBe(false)
    expect(wrapper.get('button').attributes()).not.toHaveProperty('disabled')

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes()).toHaveProperty('disabled')
    expect(wrapper.find('[role="loading"]').exists()).toBe(true)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/posts')

    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('button').attributes()).not.toHaveProperty('disabled')

  })

  }
)