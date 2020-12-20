

// sort a string of attrs
const sortAttrs = attrs => attrs.split('').sort().join('')

class AttrSet {
    constructor(attr_str) {
        this.attrs = new Set(attr_str.split('').filter(e => e !== ' '))
    }

    /**
     * Return a copy of this set
     * @return {AttrSet} a new set with the same values
     */
    clone() {
        // hacky but it works
        return new AttrSet(this.to_str())
    }

    /**
     * Return a new set with the union of this set and the passed-in set
     *
     * @param {AttrSet} other a set with possibly the same values
     * @return {AttrSet} a new set with the union of this set and the others
     */
    union(other) {
        const copy = this.clone()

        for (let attr of other.attrs) {
            copy.attrs.add(attr)
        }

        return copy
    }

    /**
     * Return a new set with the intersect of this set and the passed-in set
     *
     * @param {AttrSet} other a set with possibly the same values
     * @return {AttrSet} a new set with the intersect of this set and the others
     */
    intersect(other) {
        const intersect = new AttrSet('')

        for (let attr of other.attrs) {
            if (this.attrs.has(attr)) {
                intersect.attrs.add(attr)
            }
        }

        return intersect
    }


    /**
     * Makes the powerset of the set
     * @return {Array} array of attrsets
     */
    powerset() {
        const getAllSubsets = 
            arr => arr.reduce(
                (subsets, value) => subsets.concat(
                    subsets.map(set => [value,...set])
                ),
                [[]]
            )

        return getAllSubsets([...this.attrs])
            .map(set => new AttrSet(set.join('')))
            .filter(set => set.attrs.size !== 0)
    }

    /**
     * Return a new set with the difference of this set and the passed-in set (this - other)
     *
     * @param {AttrSet} other a set with possibly the same values
     * @return {AttrSet} a new set with the difference of this set and the others
     */
    difference(other) {
        const copy = this.clone()
        
        for (let attr of other.attrs) {
            copy.attrs.delete(attr)
        }

        return copy
    }

    /**
     * Checks equality
     *
     * @param {AttrSet} other a set with possibly the same values
     * @return {boolean} true if these have the same elements
     */
    equals(other) {
        if (this.attrs.size !== other.attrs.size) {
            return false
        }

        for (let attr of other.attrs) {
            if (!this.attrs.has(attr)) {
                return false
            }
        }

        return true
    }

    /**
     * Check if the arg is a subset of this attribute set
     *
     * @param {AttrSet} sub candidate attribute set
     * @return {boolean} true if sub is a subset of this set
     */
    has_subset(sub) {
        for (let a of sub.attrs) {
            if (!this.attrs.has(a)) {
                return false
            }
        }

        return true
    }


    toString() {
        return this.to_str()
    }

    to_str() {
        let out = ''
        for (let a of this.attrs) {
            out += a
        }

        return out
    }

    to_latex() {
        return this.to_str()
    }
}

class FD {
    constructor(line) {
        const [lhs, rhs] = line.split('->')

        this.lhs = new AttrSet(lhs)
        this.rhs = new AttrSet(rhs)
    }

    /**
     * Clone this object
     * @return {FD} a brand new equivalent FD
     */
    clone() {
        const copy = new FD('->')
        copy.lhs = this.lhs.clone()
        copy.rhs = this.rhs.clone()
        return copy
    }

    /**
     * Check equality
     * @param {FD} other FD to check against
     * @return {boolean} true if equal
     */
    equals(other) {
        return other.lhs.equals(this.lhs) && other.rhs.equals(this.rhs)
    }

    /**
     * Check if the args trip this FD
     * @param {AttrSet} attrs attribute sets to test
     * @return {boolean} true if the attrs entail the RHS
     */
    entails(attrs) {
        return attrs.has_subset(this.lhs)
    }

    /**
     * If the passed in set entails the the RHS, then union the RHS and the arg
     *
     * @param {AttrSet} attrs attribute sets to test
     * @return {AttrSet} entailed attrs
     */
    apply(attrs) {
        if (!this.entails(attrs)) {
            return attrs
        }

        return attrs.union(this.rhs)
    }

    toString() {
        return this.to_str()
    }
    to_str() {
        return `${this.lhs}->${this.rhs}` 
    }
    to_latex() {
        return `${this.lhs.to_latex()}\\to ${this.rhs.to_latex()}`
    }
}

class FDClosureSteps {
    constructor() {
        this.steps = []
    }
    add_step(step_num, attrs, fd) {
        this.steps.push([step_num, attrs.clone(), fd === null ? null : fd.clone()])
    }

    to_str() {
        const render_step = step => {
            let fd_step = step[2] === null ? 'given' : step[2].to_str()
            return `[${step[0]}] ${step[1].to_str()} (${fd_step})`
        }

        return this.steps.map(render_step).join('\n')
    }

    to_html() {
        const render_step = step => {
            let fd_step = step[2] === null ? '\\text{given}' : step[2].to_latex()
            return `<li><span data-katex>${step[1].to_latex()}</span> (<span data-katex>${fd_step}</span>)</li>`
        }

        return `<ol>${this.steps.map(render_step).join('\n')}</ol>`
    }

    to_latex() {
        const render_step = step => {
            let fd_step = step[2] === null ? ' (given)' : `by \\(${step[2].to_latex()}\\)`
            return `\\item \\(${step[1].to_latex()}\\) ${fd_step}`
        }
        return `\\begin{enumerate}\n${this.steps.map(render_step).join('\n')}\n\\end{enumerate}`
    }
}

class FDSet {
    constructor(description) {
        this.fds = description
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '')
            .map(line => new FD(line))
    }

    /**
     * Clone a set of FDs
     * @return {Array} array of FDs
     */
    clone() {
        const new_fds = new FDSet('')
        new_fds.fds = this.fds.map(f => f.clone())
        return new_fds
    }

    /**
     * Make a new set by removing an FD
     * @param {FD} target_fd fd to remove
     * @return {FDSet} a new FDSet without the target fd
     */
    remove(target_fd) {
        const new_fds = this.clone()
        new_fds.fds = new_fds.fds
            .filter(fd => !fd.equals(target_fd))

        return new_fds
    }

    /**
     * Get a union of all the left-hand sides
     * @return {AttrSet} a union of all LHSs
     */
    get_all_lhs() {
        return this.fds.reduce((a,c) => a.union(c.lhs), new AttrSet(''))
    }

    /**
     * Get a union of all the right-hand sides
     * @return {AttrSet} a union of all RHSs
     */
    get_all_rhs() {
        return this.fds.reduce((a,c) => a.union(c.rhs), new AttrSet(''))
    }

    /**
     * Get all attributes
     *
     * @return {AttrSet} a set of all the attributes this set covers
     */
    get_all_attrs() {
        return this.get_all_lhs().union(this.get_all_rhs())
    }

    /**
     * Get the closure of an attribute set with respect to this set
     * @param {AttrSet} source source attr set
     * @return {[AttrSet, steps]} tuple of the entailed set and the steps
     */
    closure(source) {
        let fds = this.clone()
        let stepno = 0
        const steps = new FDClosureSteps()
        steps.add_step(0, source, null)
        
        while (true) {
            // figure out what we can apply
            let applicable = fds.fds.filter(fd => fd.entails(source))

            // if we can't get anywhere, then stop
            if (applicable.length === 0) {
                break
            }

            // pick any applicable FD
            let fd_candidate = applicable[0]

            // remove it from the set
            fds = fds.remove(fd_candidate)

            // get entailment
            source = fd_candidate.apply(source)

            // for posterity
            stepno += 1
            steps.add_step(stepno, source, fd_candidate)


            // safety -- have we iterated too much?
            if (stepno > this.fds.length) {
                console.warn('something probably went wrong')
                break
            }
        }

        return [source, steps]
    }

    /**
     * Get all the keys for the set
     * @return {Array} set of AttrSets
     */
    get_keys() {
        const all_attrs = this.get_all_attrs()


        const candidate_keys = all_attrs
            .powerset()
            .map(set => [set, this.closure(set)[0]])
            .filter(set => set[1].equals(all_attrs))
            .map(set => set[0])


        const keys = []
        for (let key_i of candidate_keys) {
            let found_sub = false
            for (let key_j of candidate_keys) {
                if (key_i.has_subset(key_j) && !key_i.equals(key_j)) {
                    found_sub = true
                }
            }

            if (!found_sub) {
                keys.push(key_i)
            }
        }

        return keys
    }

    /**
     * Get prime attrs
     * @return {AttrSet} set of all prime attributes
     */
    get_prime_attrs() {
        const keys = this.get_keys()
        return keys.reduce((a,c) => a.union(c), new AttrSet(''))
    }

    /**
     * Get BCNF
     */

    /**
     * Convert this to a string
     */
    toString() {
        return this.to_str()
    }

    /**
     * Convert this to a string
     */
    to_str(endl='\n') {
        return this.fds.map(f => f.to_str()).join(endl)
    }

    /**
     * Convert to HTML
     */
    to_html() {
        return `<span data-katex>${this.to_latex()}</span>`
    }

    /**
     * Convert to latex
     * @param {str} name set name (\\Sigma by default)
     */
    to_latex(name='\\Sigma') {
        if (name === null) {
            const inner = this.fds.map(f => f.to_latex()).join('\\\\')
            return inner
        } else {
            const inner = this.fds.map(f => '\\\\ \\qquad ' + f.to_latex()).join(',\n ')
            return `${name} = \\{\n ${inner}\\\\\\}`
        }
    }
}
