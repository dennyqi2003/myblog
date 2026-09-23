[^Date]: 2026.01.11
[^ERT ]: 13min
[^Author]: DennyQi
[^Title]: 03 λ-calculus的归约
[^Tag]: Informatics, Computation Theory, Lambda Calculus

在之前的讨论中，我们用等号$=$表示“可以演算得到”，并且规定等号具有自反、对称、传递的基本性质。这就意味着，我们不仅可以说$(\lambda x.xx)N$能演算得到$NN$，根据对称性也可以说$NN$能演算得到$(\lambda x.xx)N$。后者听上去很奇怪，因为与其说是“演算”，后者更像是一种“构造”。作为演算规则的$\beta$-conversion事实上不应该具有对称性，因为它总是倾向于将$\lambda$-term“化简”。因此我们意识到，何为“化简”还没有得到严格的定义。我们应当严格定义一个集合$\Lambda$上的二元关系，来描述“化简”。

## 归约(Reduction)

如果我们把$\alpha$-equivalance看作语法上的设定(convention)，也即我们总是避免局部变量与全局变量的重名，那么$\lambda$-calculus中唯一的演算规则就是$\lambda$-term整体的$\beta$-conversion或某一局部的$\beta$-conversion。我们定义符号$\rightarrow_\beta$表示“单步$\beta$-reduction”：

- 对任意的$\lambda$-term $M,N$和变量$x$，$(\lambda x.M)M\rightarrow_\beta M[x:=N]$；
- 对任意的$\lambda$-term $M,N,Z$，如果$M\rightarrow_\beta N$，那么$ZM\rightarrow_\beta ZN$；
- 对任意的$\lambda$-term $M,N,Z$，如果$M\rightarrow_\beta N$，那么$MZ\rightarrow_\beta NZ$；
- 对任意的$\lambda$-term $M,N$和变量$x$，如果$M\rightarrow_\beta N$，那么$\lambda x.M\rightarrow_\beta \lambda x.N$；

基于单步$\beta$-reduction，可以定义多步$\beta$-reduction（或简称$\beta$-reduction），用符号$\twoheadrightarrow_\beta$表示（多步包括0步）：

- 对任意的$\lambda$-term $M$，$M\twoheadrightarrow_\beta M$；（0步）
- 对任意的$\lambda$-term $M,N$，如果$M\rightarrow_\beta N$，那么$M\twoheadrightarrow_\beta N$；（单步）
- 对任意的$\lambda$-term $M,N,L$，如果$M\twoheadrightarrow_\beta N,N\twoheadrightarrow_\beta L$，那么$M\twoheadrightarrow_\beta L$；

>  多步$\beta$-reduction满足自反和传递，而不满足对称。这样的关系称为congruence关系。

下面定义符号$=_\beta$，称为$\beta$-conversion：

- 对任意的$\lambda$-term $M,N$，如果$M\twoheadrightarrow_\beta N$，那么$M=_\beta N$；
- 对任意的$\lambda$-term $M,N$，如果$M =_\beta N$，那么$N=_\beta M$；（单步）
- 对任意的$\lambda$-term $M,N,L$，如果$M=_\beta N,N=_\beta L$，那么$M=_\beta L$；

可以看到，$\beta$-conversion满足自反、对称、传递，是$\Lambda$上的等价关系。这其实就是原先“$=$”的含义，只不过原先我们把$\alpha$-equivalence也看作演算。

下面的图片清晰展示了$\beta$-reduction和$\beta$-conversion之间的区别：图中一个箭头表示单步$\beta$-reduction，同一直线上的箭头可以连成一个多步$\beta$-reduction。而在忽略掉箭头的有向性只关注两个点之间的连通，就表示$\beta$-conversion。

<center><img src="https://blog-static.cnblogs.com/files/qixingzhi/beta_conversion.gif" alt="image-20250205014522060" style="zoom:33%;" /></center>

## Church-Rosser定理

每一步$\beta$-reduction会消去一个形如$(\lambda x.M)N$的subterm，所以随着$\beta$-reduction的进行一个term中的$\lambda$会越来越少直到无法再进行任何$\beta$-reduction。自然的问题是，在$\lambda$-calculus这个形式系统中，对于任何term，$\beta$-reduction是否会在有限步内结束，如果采取不同的顺序做$\beta$-reduction是否会导出唯一的“化简结果”？也就是我们要研究$\beta$-reduction的性质。

人们发现，$\beta$-reduction的性质很大程度上基于Church-Rosser定理。这个定理表述如下：对于$\lambda$-term $M,N_1,N_2$，如果有$M\twoheadrightarrow_\beta N_1,M\twoheadrightarrow_\beta N_2$，那么一定存在$\lambda$-term $N_3$满足$N_1\twoheadrightarrow_\beta N_3,N_2\twoheadrightarrow_\beta N_3$。Church-Rosser定理可以用下面的图片清晰地展示：

<center><img src="https://blog-static.cnblogs.com/files/qixingzhi/church_rosser_thm.gif" alt="image-20250205015736469" style="zoom: 33%;" /></center>

### Church-Rosser定理的证明

为了方便讨论，我们把形如$(\lambda x M)N$的$\lambda$-term称为一个$\lambda$-redex（“形如”的意思是如果$\lambda$-term $Z$满足：存在$\lambda$-term $M,N$使得$Z\equiv (\lambda xM)N$）。如果一个$\lambda$-term不存在任何$\lambda$-redex作为subterm就称它为一个$\beta$-normal form（简称$\beta$-nf）。

容易理解，一个$\lambda$-redex会被$\beta$-reduction“化简”，而$\beta$-normal form不能再继续化简。一个$\beta$-nf已经是“最简式”了：如果$M$是$\beta$-nf，那么对任意$N$，如果$M\twoheadrightarrow_\beta N$，则$M\equiv N$（归纳证明：如果$M\equiv N$显然；$M$走一个单步根据定义依然得到$M$，因此根据归纳假设走剩余的步依然得到$M$）。

（待续）

### Church-Rosser定理的推论

根据Church-Rosser定理我们可以得到以下结论：如果$M=_\beta N$，那么存在$L$满足$M\twoheadrightarrow_\beta L,N\twoheadrightarrow_\beta L$。

证明如下：依据$=_\beta$的定义归纳。若$M=_\beta N$是因为$M\twoheadrightarrow_\beta N$，那么取$L\equiv N$即可；若$M=_\beta N$是因为$N=_\beta M$，那么由归纳假设可证；若$M=_\beta N$是因为存在$N'$使得$M=_\beta N',N'=_\beta N$，那么由归纳假设可以找到$L_1$满足$M\twoheadrightarrow_\beta L_1,N'\twoheadrightarrow_\beta L_1$，$L_2$满足$N'\twoheadrightarrow_\beta L_2,N\twoheadrightarrow_\beta L_2$。根据$N'\twoheadrightarrow_\beta L_1,N'\twoheadrightarrow_\beta L_2$，由Church Rosser定理可知存在$L$满足$L_1\twoheadrightarrow_\beta L,L_2\twoheadrightarrow_\beta L$。。因此$M\twoheadrightarrow_\beta L,N\twoheadrightarrow_\beta L$。证毕。该证明可以由下面的图片清晰展示：

<center><img src="https://blog-static.cnblogs.com/files/qixingzhi/church_rosser_col1_pf.gif" alt="image-20250205022431151" style="zoom:33%;" /></center>

下面我们证明，一个$\lambda$-term至多只能“化简”得到一个$\beta$-nf：如果$M=_\beta N_1,M=_\beta N_2$且$N_1,N_2$都是$\beta$-nf，那么$N_1\equiv N_2$。证明：由$\beta$-conversion的对称性与传递性可知$N_1=_\beta N_2$，那么由上面的推论可知存在$L$使得$N_1\twoheadrightarrow_\beta L,N_2\twoheadrightarrow_\beta L$。而$N_1,N_2$是$\beta$-nf意味着它们已经是“最简式”，不能再由$\beta$-reduction箭头向下到达一个与其不相同的term，因此$N_1\equiv L,N_2\equiv L$，也即$N_1\equiv N_2$。证毕。

这样就回答了我们的问题，无论采取什么样的归约顺序我们都会得到一个唯一的最简式。如果两个$\lambda$-term之间能够做$\beta$-conversion（$=_\beta$），那么它们最终能$\beta$-reduce到同一个$\beta$-nf（根据上面的推论它们能归约到同一个term，这个term会被reduce到一个唯一的$\beta$-nf）。

从逻辑系统的角度看，这还能用来说明$\lambda$-calculus是一个一致(consistent)的系统：证明一致性，只需证明该系统存在一个无法证明的命题。由于存在不同的两个$\beta$-nf，比如真和假，$\lambda xy.x$和$\lambda xy.y$，一定有$\lambda xy.x\not=_\beta \lambda xy.y$。否则它们能reduce到同一个$\beta$-nf，矛盾。

### Normalization Theorem

然而，一个$\lambda$-term的$\beta$-reduction有可能是不终止的（无穷次reduce）。仿照不动点定理的构造，可以令$\Omega=(\lambda x.xx)(\lambda x.xx)$，我们有$\Omega\rightarrow_\beta \Omega$，而$\Omega$按照定义并不是一个$\beta$-nf，因此$\Omega$无法reduce到某个$\beta$-nf。

另一方面，每一步选择哪一个subterm做$\beta$-reduction是一个关键的问题。存在这样的情况，如果按照某一策略归约会无穷进行下去，而按照另一策略却是有穷的。例如，考虑$\textsf{KI}\Omega\equiv (\lambda xy.x)(\lambda x.x)((\lambda x.xx)(\lambda x.xx))$。如果选择归约$\textsf{K}$，那么我们将一步得到$\textsf{KI}\Omega\rightarrow_\beta \textsf{I}$；如果选择归约$\Omega$，那么$\textsf{KI}\Omega\rightarrow_\beta \textsf{KI}\Omega$，归约会无穷进行下去。所以在寻找$\beta$-nf时选择一个恰当的顺序是重要的，这通常称为归约的strategy(策略)。

可以证明，对于$\lambda$-term $M$，如果存在$\beta$-nf $N$满足$M=_\beta N$，那么只需在每一步都选择对最左侧的$\beta$-redex做归约就可以由$M$归约得到$N$。这称为Normalization Theorem（归一化定理）。（证明略）。我们因此把$\lambda$-term的最左归约称为normalizing。





















