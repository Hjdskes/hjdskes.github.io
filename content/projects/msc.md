+++
date = "2018-11-02T11:00:00+01:00"
title = "MSc thesis: Abstract Interpretation of Program Transformations using Regular Tree Grammars"
type = "University"
+++

I completed my MSc thesis at the [Programming Languages
group](https://www.tudelft.nl/en/eemcs/the-faculty/departments/software-technology/programming-languages/)
of the TU Delft under the supervision of [Dr.
S.T. Erdweg](http://www.erdweg.org) and [Sven
Keidel](https://svenkeidel.de).

Program transformations translate code of an input language to code of
an output language. Examples of program transformations are
desugarings, optimizations and refactorings. Developers of program
transformations need to ensure correctness of their programs. For
example, for a desugaring we would want to know whether all sugar
constructs have been removed after the transformation. Existing
program transformation languages guarantee well-sortedness, which
means that the output programs of a transformation are syntactically
well-formed in the output language. However, this property is not
precise enough to for example guarantee the removal of all sugar
constructs after a desugaring transformation.

In my thesis, I developed two static analyses by means of abstract
interpretation for the Stratego program transformation language. The
first analysis implements a sort analysis, which we use as a baseline
for comparison. The second analysis uses a more precise abstract
domain, namely that of regular tree grammars. This domain allows the
analysis to approximate the syntactic shape of code, which results in
more precise results. I proved soundness of the most important parts
of these two analyses.

I did not write a regular thesis report; rather, I wrote a "thesis
paper" which we are preparing to submit. The version I handed in for
my thesis defence is
[available](http://resolver.tudelft.nl/uuid:f634ef6a-68d1-4d38-9474-db8cdb12425f)
in the repository of the TU Delft. The abstract is reproduced below:

***Abstract:*** *Many program transformation languages simplify the
implementation of program transformations. However, they give only
weak static guarantees about the generated code such as
well-sortedness. Well-sortedness guarantees that a program
transformation does not generate syntactically ill-formed code, but it
is too imprecise for many other scenarios. In this paper, we present a
static analysis that allows developers of program transformations to
reason about their transformations on a more fine-grained level,
namely that of syntactic shape. Specifically, we present an abstract
interpreter for the Stratego program transformation language that
approximates the syntactic shape of transformed code using regular
tree grammars. As a baseline, we also present an abstract interpreter
that guarantees well-sortedness. We prove parts of both abstract
interpreters sound.*

You can browse the slides of my defence below:

{{% google-slides src="https://docs.google.com/presentation/d/e/2PACX-1vSFMcpRCVEHRT7rTmMxwC2wHCsK3XQneYOVv3u3AroGr88K9gkg-x72ImMmvBjhjUpNqvh1GRIul_t3/embed?start=false&loop=false&delayms=3000" %}}
