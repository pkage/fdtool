// --- AttrSet ---

const test_AttrSet = expect => {

    const expect_equals = (aset, str, op) => expect(aset.to_str() === str, `expected ${aset.to_str()} === ${str} under ${op}`)

    const a = new AttrSet('ABCD')
    const b = new AttrSet('ABC')
    const c = new AttrSet('CDE')
    const d = new AttrSet('F')
    const e = new AttrSet('A B C')

    expect_equals(a, 'ABCD', 'nop')
    expect_equals(e, 'ABC', 'space rejection')


    expect_equals(a.union(b), 'ABCD', 'union')
    expect_equals(a.union(c), 'ABCDE', 'union')
    expect_equals(a.union(b).union(c), 'ABCDE', 'union')

    expect_equals(a.intersect(c), 'CD', 'intersect')
    expect_equals(a.intersect(b), 'ABC', 'intersect')
    expect_equals(b.intersect(c), 'C', 'intersect')
    expect_equals(a.intersect(d), '', 'intersect')

    expect_equals(a.difference(b), 'D', 'difference')
    expect_equals(b.difference(c), 'AB', 'difference')
    expect_equals(d.difference(c), 'F', 'difference')

    expect(a.has_subset(b), 'subset')
    expect(!a.has_subset(c), '!subset')
    expect(!a.has_subset(d), '!subset')

    expect(a.equals(a), 'equality')
    expect(a.equals(new AttrSet('BCDA')), 'equality')
    expect(!a.equals(b), 'equality')

    expect(a.equals(a.clone()), 'cloning')
}

const test_FD = expect => {
    const expect_equals = (aset, str, op) => expect(aset.to_str() === str, `expected ${aset.to_str()} === ${str} under ${op}`)
    const fd1 = new FD('AB->CD')

    // basics
    expect_equals(fd1.lhs, 'AB', 'lhs')
    expect_equals(fd1.rhs, 'CD', 'rhs')
    expect(fd1.to_str() === 'AB->CD', 'to_str')
    expect(fd1.to_latex() === 'AB\\to CD', 'to_latex')

    // check entailment
    expect(fd1.entails(new AttrSet('ABC')), 'entailment')
    expect(!fd1.entails(new AttrSet('BC')), 'entailment')

    // check application
    expect_equals(fd1.apply(new AttrSet('AB')), 'ABCD', 'fd application')
    expect_equals(fd1.apply(new AttrSet('BC')), 'BC', 'fd application')

    // check cloning
    expect(fd1.to_str() == fd1.clone().to_str(), 'cloning')

    // check equality
    expect(fd1.equals(new FD('BA->DC')), 'equality')
}

const test_FDSet = expect => {
    const expect_equals = (aset, str, op) => expect(aset.equals(new AttrSet(str)), `expected ${aset.to_str()} === ${str} under ${op}`)

    const fds = new FDSet(`
        EF->BC
        A->D

        B->AE
        BD->C
    `)

    // test constructor
    expect_equals(fds.fds[0].lhs, 'EF', 'constructor')
    expect_equals(fds.fds[0].rhs, 'BC', 'constructor')
    expect_equals(fds.fds[1].lhs, 'A', 'constructor')
    expect_equals(fds.fds[1].rhs, 'D', 'constructor')
    expect_equals(fds.fds[2].lhs, 'B', 'constructor')
    expect_equals(fds.fds[2].rhs, 'AE', 'constructor')
    expect_equals(fds.fds[3].lhs, 'BD', 'constructor')
    expect_equals(fds.fds[3].rhs, 'C', 'constructor')

    // get all LHS
    expect_equals(fds.get_all_lhs(), 'ABDEF', 'lhs union')
    // get all RHS
    expect_equals(fds.get_all_rhs(), 'ABCDE', 'rhs union')

    // get all attrs
    expect_equals(fds.get_all_attrs(), 'ABCDEF', 'all attrs')

    // convert to str
    expect(fds.to_str() === `EF->BC\nA->D\nB->AE\nBD->C`, 'string conversion')

    // fd cloning
    expect(fds.to_str() === fds.clone().to_str(), 'cloning')

    // removal by value
    expect(fds.remove(new FD('B->EA')).to_str() === `EF->BC\nA->D\nBD->C`, 'removal')

    // replace by value
    expect(fds.replace(new FD('B->EA'), new FD('B->A')).to_str() === 'EF->BC\nA->D\nB->A\nBD->C', 'replacement')

    // closure
    const [attrs, ] = fds.closure(new AttrSet('FE'))
    expect_equals(attrs, 'ABCDEF', 'closure')
    window.fds = fds
}

// --- Run tests ---

const runTests = tests => {
    let dirty = false
    const expect = (exp, msg) => {
        console.assert(exp, msg)
        if (!exp) {
            dirty = true
            const err = new Error()
            const suite = err.stack.split('\n')
                .filter(l => l.indexOf('test_') !== -1)
            console.error(`Probably from ${suite}`)
        }
    }

    for (let test of tests) {
        test(expect)
    }

    if (dirty) {
        console.warn('Not all tests passed!')
    } else {
        console.log('All tests passed!')
    }
}

runTests([
    test_AttrSet,
    test_FD,
    test_FDSet
])

