class Controller {
    constructor() {
        this.input_textarea = document.querySelector('#input_fds')
        this.input_attrs    = document.querySelector('#input_attrs')

        this.output_html  = document.querySelector('#output_html')
        this.output_latex = document.querySelector('#output_latex')
        this.output_info  = document.querySelector('#output_info')

        this.trigger = document.querySelector('#compute')

        this.trigger.addEventListener('click', () => this.compute())
    }

    typeset() {
        document.querySelectorAll('[data-katex]')
            .forEach(el => {
                const expr = el.innerText
                katex.render(expr, el)
                el.removeAttribute('data-katex')
            })
    }

    compute() {
        const fds_text = this.input_textarea.value
        const attrs_text = this.input_attrs.value

        const fds = new FDSet(fds_text)
        const attrs = new AttrSet(attrs_text)

        const [output_attrs, closure_steps] = fds.closure(attrs)
        const [min_cover, min_cover_steps] = fds.get_minimal_cover()

        this.output_latex.innerText = `% db
${fds.to_latex()}

% closure under ${attrs.to_latex()}
${closure_steps.to_latex()}`


        this.output_html.innerHTML = `<b>Interpreted relations as:</b><br>
<span data-katex>${fds.to_latex()}</span><br/>
<b>Computed <span data-katex>C_\\Sigma(${attrs.to_latex()})</span> as:</b><br/>
${closure_steps.to_html()}<br/>

<div class="block">
    <h2 class="title is-size-4">Minimal cover</h2>
    <details>
        <summary>Click to show</summary>
        ${min_cover_steps.to_html()}
        <pre>${min_cover_steps.to_latex()}</pre>
    </details>
</div>
`
        const keys = fds.get_keys().map(a => a.to_latex()).join(', ')
        const primes = fds.get_prime_attrs().to_latex()
        
        const bcnf = fds.check_bcnf()
            .map(o => `<li>
                <span data-katex style="${o.bcnf ? 'color:green;' : 'color:red;'}">
                    ${o.fd.to_latex()}
                </span> <i>${o.reason}</i></li>`)
            .join('')

        const threenf = fds.check_3nf()
            .map(o => `<li>
                <span data-katex style="${o['3nf'] ? 'color:green;' : 'color:red;'}">
                    ${o.fd.to_latex()}
                </span> <i>${o.reason}</i></li>`)
            .join('')


        this.output_info.innerHTML = `<div class="block">
    <h2 class="title is-size-4">Info</h2>
    <b>Keys: <span data-katex>\\{${keys}\\}</span></b><br/>
    <b>Primes: <span data-katex>\\{${primes}\\}</span></b><br/>
</div>
<div class="block">
    <h2 class="title is-size-4">BCNF</h2>
    <ol>${bcnf}</ol>
</div>
<div class="block">
    <h2 class="title is-size-4">3NF</h2>
    <ol>${threenf}</ol>
</div>
`

        this.typeset()
    }
}

ctrl = new Controller()
