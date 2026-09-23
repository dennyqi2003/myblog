[^Date]: 2026.01.25
[^ERT ]: 36min
[^Author]: DennyQi
[^Title]: 01 ZFC Axioms
[^Tag]: Mathematics, Set Theory

## ZF公理

Zermelo-Frenkel(ZF)集合论公理包括九条公理。下面我们用一阶逻辑写出这九条公理，其中符号集为$S=\{\in\}$：

- 公理0：$\exists x(x\equiv x)$；
- 公理1：$\forall x \forall y \left( \forall z (z \in x \leftrightarrow z \in y) \rightarrow x \equiv y \right)$；
- 公理（组）2：$\forall z\forall w_1\cdots \forall w_n\exists y\forall x(x\in y\leftrightarrow x\in z \land \varphi)$，其中$n$为任意正整数，且公式$\varphi$的自由变量只可能包含$x,z,w_1,\cdots,w_n$；
- 公理3：$\forall x \forall y \exists z\left( x\in z\land y\in z \right)$；
- 公理4：$\forall x\exists y\forall z\forall u(u \in z\land z\in x\to u\in y)$；
- 公理（组）5：$\forall z\forall x_1\cdots \forall x_n((\forall x(x\in z\to\exists ^{=1}y\varphi))\to \exists v(\forall x(x \in z\to \exists y(y\in v\land \varphi))))$，其中$n$为正整数，且公式$\varphi$的自由变量只可能包含$x,y,x_1,\cdots,x_n$，$\exists ^{=1}y\varphi$是$\exists y\varphi\land \forall y'(\varphi\dfrac{y'}{y}\to y'\equiv y)$的缩写；
- 公理6：$\exists x(\varnothing\in x\land \forall y(y\in x\to y\cup \{y\}\in x))$；（符号$\varnothing\in x$和$y\cup\{y\}$都是简写，其含义将在后文定义）
- 公理7：$\forall x \exists y \forall z\left( z\in y\leftrightarrow \forall w(w\in z\to w\in x)\right)$；
- 公理8：$\forall x(\exists y(y\in x)\to \exists y(y\in x \land \neg\exists z(z \in x\land z \in y)))$；

自然，当我们要为这套一阶逻辑公理赋予语义时，论域中的任何一个元素都是“集合(set)”。这就是为什么我们说：在ZF公理下，“一切数学对象都是集合”。当然，“一切数学对象”是一个模糊的说法，许多看上去是数学对象的东西其实并不是集合，“罗素悖论”就是因为没有清晰定义“什么可以作为集合”才产生的。ZF公理正是给出了许多构造集合的方法，来澄清什么可以作为集合，什么不可以作为集合。

另一方面，根据斯科伦-勒文海姆定理，因为我们使用了符号集为有限集$\{\in\}$的一阶逻辑语言，这套公理一定存在一个论域可数的模型。但是我们又将看到，ZF公理可以推出描述“存在不可数集合”的公式。这就是斯科伦悖论(Skolem's paradox)。这个论域可数的集合可以看作ZF集合论的一个非标准模型。但是，集合论的“标准模型”是什么，这件事本身也是不清楚的。所以应当牢记我们接下来要做的一切只是从形式系统的角度出发，由以上这些公理推出定理。我们对这些公理和定理做出的解释，并不是在某个标准模型下的语义，而是对它们在形式证明中所起到的作用的一种“显示”。

## 公理0：存在公理

“$\exists x(x\equiv x)$”称为“存在公理(existence)”，它表明至少存在一个集合。

## 公理1：外延公理

“$\forall x \forall y \left( \forall z (z \in x \leftrightarrow z \in y) \rightarrow x \equiv y \right)$”称为“外延公理(extentionality)”，它使得我们要证明一个集合$x$“等于”另一个集合$y$时，只需从形式上证明$\forall z (z \in x \leftrightarrow z \in y)$。其中，“外延”这个词来源于哲学。一个概念的外延就是这个概念所适用的所有具体对象。例如按照弗雷格的函项理论，概念词“人”的外延就是所有能被填入“()是人”的括号内的对象。ZF集合论的外延公理告诉我们，集合$x$的外延就是全体满足$z\in x$的$z$，两个集合是“相等的”当且仅当它们的外延相等。

## 公理2：概括公理

概括公理是一系列的公理组“$\forall z\forall w_1\cdots \forall w_n\exists y\forall x(x\in y\leftrightarrow x\in z \land \varphi)$”。其中$n$可以取任意正整数。公式$\varphi$也可以是任意的，只要其满足自由变量只包含$x,z,w_1,\cdots,w_n$。这组公理称为“概括公理(comprehension)”，它为我们提供了由“性质”构造集合的方法。在自然语言中，这样的构造方法通常写为$\{x\mid \varphi(x)\}$。

由性质构造集合时，必须格外小心。我们没有直接把概括公理写为$\exists y\forall x(x \in y\leftrightarrow \varphi)$，因为当$\varphi=\neg x\in x$时，会引发罗素悖论(Russell's paradox)：对于集合$y=\{x\mid \neg x \in x\}$，如果$y\in y$，那么$\neg y\in y$；如果$\neg y\in y$，那么$y\in y$。于是，$y\in y\leftrightarrow \neg y\in y$，于是公理系统就是不可满足的，也即不一致的。

因此，依据概括公理，当我们要由性质$\varphi$构造集合时，必须首先确定一个集合$z$，然后再用公式$\varphi$描述“子集关系”，这样才能用公式$\varphi$构造一个$z$的子集。从这个角度，我们就已经发现ZF公理不允许存在一个“包含了所有集合的集合”，因为假如这样一个集合存在，我们就可以把它作为$z$构造出罗素悖论$y=\{x\in z\mid \neg x \in x\}$了。

依据概括公理，对任意集合$x$，存在$x$的一个子集$\{z\in x\mid x=x\}$，这个集合用符号记为$\{x\}$，称为包含$x$的单元集(singleton)。

取$\varphi=\neg x\equiv x$，由概括公理可知$\forall z\exists y\forall x(x\in y\leftrightarrow x\in z \land \neg x\equiv x)$。但是$\neg x\equiv x$始终为假。所以，存在一个集合$y$满足$\forall x(\neg x\in y)$。根据外延公理，这样一个集合是唯一的。我们把这个集合称为空集，记为$\varnothing$。

> “记为$\varnothing$”的含义是，任何一个带有$\varnothing$的公式都是另一个不带有$\varnothing$公式的缩写。对任何带有$\varnothing$的公式$\varphi$，它都是$\exists A((\forall x(\neg x\in A))\land \varphi\dfrac{A}{\varnothing})$的缩写。例如$y\equiv \varnothing$是$\exists A((\forall x(\neg x\in A))\land y\equiv A)$的缩写。

我们把符号$\subseteq$用于缩写。把$\forall x(x\in y\to x\in z)$缩写为$y\subseteq z$。

## 公理3：配对公理

“$\forall x \forall y \exists z\left( x\in z\land y\in z \right)$”称为“配对公理(pairing)”，它继概括公理以后又为我们提供了一种构造集合的方式。任给两个集合$x,y$，存在一个集合$z$又有$x$作为元素，又有$y$作为元素。而依据概括公理，又存在$z$的一个子集$\{u\in z\mid u=x\lor u=y\}$，也即存在一个集合有且仅有$x,y$作为元素。把这个集合用符号记为$\{x,y\}$。进而，$\{\{x\},\{x,y\}\}$也是一个集合。

把$\{x,y\}$称为由$x,y$构成的无序对(unordered pair)。

把$\{\{x\},\{x,y\}\}$称为由$x,y$构成的有序对(ordered pair)。用符号$\lang x,y\rang$表示$x,y$构成的有序对。

## 公理4：并集公理

“$\forall x\exists y\forall z\forall u(u \in z\land z\in x\to u\in y)$”称为“并集公理(union)”，它又提供了一种构造集合的方式。对于任意集合$x$，如果$x$的每个元素$z$都是包含若干元素$u$的集合，那么存在一个集合$y$包含了$x$的每个元素的元素。

进而依据概括公理，可以写出恰好包含$x$的每个元素的元素的集合$\{u\in y\mid \exists z(z\in x \land u\in z)\}$。这个集合称为集合族$\{z\mid z\in x\}$的并集，记为$\bigcup \{z\mid z \in x\}$或$\bigcup\limits_{z\in x}z$。

再次依据概括公理，还可以写出$x$的每个元素的共同元素的集合$\{u\in y\mid \forall z((z\in x)\to (u\in z))\}$，这个集合称为集合族$\{z\mid z\in x\}$的交集(intersection)，记为$\bigcap \{z\mid z \in x\}$或$\bigcap\limits_{z\in x}z$。

对于无序对$\{A,B\}$，我们引入符号$A\cup B$作为$\bigcup \{A,B\}$的缩写，$A\cap B$作为$\bigcap\{A,B\}$的缩写，$A\setminus B$作为$\{u\mid u\in A\land \neg u\in B\}$的缩写。

## 公理5：替换公理

替换公理是一系列的公理组$\forall z\forall x_1\cdots \forall x_n((\forall x(x\in z\to\exists ^{=1}y\varphi))\to \exists v(\forall x(x \in z\to \exists y(y\in v\land \varphi))))$。其中$n$可以取任何正整数。公式$\varphi$可以是任意的，只要其自由变量只包含$x,y,x_1,\cdots,x_n$。$\exists ^{=1}y\varphi$是$\exists y\varphi\land \forall y'(\varphi\dfrac{y'}{y}\to y'\equiv y)$的缩写。这个公理描述的是，我们可以依据“映射”来从定义域集合构造像集集合。其中，$z$是定义域，$\varphi$可以看作是形如$y\equiv f(x)$的。如果对任意$x\in z$都存在唯一的$y$使得$y=f(x)$，那么存在集合$v$，它包含所有$f(x)$。于是根据概括公理，像集$\{y\mid \exists x\in z,y=f(x)\}$也存在。

## 函数与二元关系

### 基本定义

对于任意两个集合$A,B$，任取$B$中的一个元素$y$，依据替换公理存在集合$\{z\mid \exists x \in A,z=\lang x,y\rang\}$。再应用一次替换公理，可以得到集合$\{z'\mid \exists y\in B,z'=\{z\mid \exists x\in A,z=\lang x,y\rang\}\}$。根据并集公理，得到集合$\bigcup\limits_{y\in B}\{z\mid \exists x\in A,z=\lang x,y\rang\}$，这也就是$\{\lang x,y\rang \mid x\in A\land y\in B\}$。这个集合称为集合$A,B$的笛卡尔积(cartesian product)，记为$A\times B$。

对于任意两个集合$A,B$，任意$A\times B$的子集$R\subseteq A\times B$称为一个二元关系(binary relation)。定义二元关系$R$的定义域(domain)为$\text{dom}(R):=\{x\mid \exists y\in B,\lang x,y\rang\in R\}$，二元关系$R$的值域(range)为$\text{ran}(R):=\{y\mid \exists x\in A,\lang x,y\rang\in R\}$。

称$f$是一个$A$到$B$的函数，如果$f\subseteq A\times B$，$\text{dom}(f)=A$，$\text{ran}(f)\subseteq B$，且对于任意$x\in A$，存在唯一一个$y\in B$使得$\lang x,y\rang\in f$。如果$\forall x,y\in A$，$x\neq y\implies f(x)\neq f(y)$，就称$f$为单射(injection)；如果$\text{ran}(f)=B$，就称$f$为满射(surjection)。如果$f$既是单射又是满射，就称$f$为双射(bijection)。通常， 把$\lang x,y\rang \in R$简记为$xRy$。

### 偏序与全序

把二元关系$R\subseteq A\times A$称为$A$上的严格偏序关系(strict partial ordering)，如果满足以下两条：

- 反自反性(irreflexivity)：$\forall x\in A$，$\neg xRx$；
- 传递性(transitivity)：$\forall x,y,z\in A$，$(xRy\land yRz)\implies xRz$；

把二元关系$R\subseteq A\times A$称为$A$上的非严格偏序关系(non-strict partial ordering)，如果满足以下三条：

- 自反性(irreflexivity)：$\forall x\in A$，$xRx$；
- 反对称性(antisymmetry)：$\forall x,y\in A,(xRy\land yRx)\implies x\equiv y$
- 传递性(transitivity)：$\forall x,y,z\in A$，$(xRy\land yRz)\implies xRz$；

对于严格偏序关系$R$，如果进一步满足下面这条，就称为严格全序关系(strict total ordering)：

- 三歧性(trichotomy)：$\forall x,y\in A,(xRy)\lor (yRx)\lor(x\equiv y)$；

对于非严格偏序关系$R$，如果进一步满足下面这条，就称为非严格全序关系(non-strict total ordering)：

- 全序性(totality)：$\forall x,y\in A,(xRy)\lor (yRx)$；

### 良序

我们把$A\times A$上的严格全序关系$R$记为$\lang A,R\rang$，注意这里我们使用了有序对的符号。严格全序也即满足反自反性、三岐性、传递性的二元关系。对于$A\times A$上的严格全序关系$R$和$B\times B$上的严格全序关系$S$，定义$\lang A,R\rang,\lang B,S\rang$是同构的当且仅当存在$A\to B$的双射$f$满足$\forall x,y\in A,xRy \iff f(x)Sf(y)$，记为$\lang A,R\rang \cong \lang B,S\rang$，$f$就称为$\lang A,R\rang $到$\lang B,S\rang$的同构映射(isomorphism)。

定义有序对$\lang A,R\rang$是良序的(well-ordered)，当且仅当$\lang A,R\rang$是一个严格全序关系，且对于任意$A$的非空子集$S$都存在$m\in S$使得$\forall n\in S,(n\neq m)\implies mRn$。可以看到，这个$m$就是$R$作为序关系意义下$S$中的最小元（$R$-least element）。

定义$\text{pred}(A,x,R):=\{y\in A\mid yRx\}$，也即序关系$R$下全体“小于”$x$的元素的集合。

对于良序的严格全序关系，有以下基本定理：

若$\lang A,R\rang$是良序的，则对于任意$x\in A$，$\lang A,R\rang \not\cong \lang \text{pred}(A,x,R),R\rang$。直观上，一个好的序关系会因为$\text{pred}(A,x,R)$排除了$x$以及比$x$大的元素，从而使得$\text{pred}(A,x,R)$作为$A$的真子集并不能和$A$一一对应。
严格证明：
假设存在$f$作为同构映射。根据概括公理，$S=\{y\in A\mid f(y)\neq y\}$是$A$的一个子集。
首先验证$S$是非空的，因为$f(x)\in \text{pred}(A,x,R)$，而$x\not\in \text{pred}(A,x,R)$，因此$f(x)\neq x$，从而$x\in S$。
其次，因为$\lang A,R\rang$是良序的，因此$S$有最小元$m$。因为$m\in S$，所以$f(m)\neq m$。因为$m$是$S$的最小元，所以对于任意$z$满足$zRm$，一定有$z\not\in S$。因为$z\notin S$，所以根据$S$的定义有$f(z)=z$。现在，根据同构的定义，$zRm$当且仅当$f(z)Rf(m)$当且仅当$zRf(m)$。
下面我们证明$mRf(m)$。反证法，如果$f(m)Rm$，那么用$f(m)$代入$z$可得$f(m)Rf(m)$，违反了反自反性。所以$mRf(m)$。证毕。
下面让我们分类讨论$x$和$m$的大小关系。
若$x=m$，由$f(x)\in \text{pred}(A,x,R)$，因此$f(x)Rx$，所以$f(m)Rm$，矛盾；
若$xRm$，这与$x\in S$且$m$是$S$的最小元矛盾；
若$mRx$，则$m\in \text{pred}(A,x,R)$。根据$f$是满射，存在$a\in A$使得$f(a)=m$。再次分类讨论$a$与$m$的序关系：
	若$aRm$，则$a\notin S$，则$f(a)=a=m$，矛盾；
	若$a=m$，则$f(m)=m$，矛盾；
	若$mRa$，则$f(m)Rf(a)$，也即$f(m)Rm$，矛盾；
综上所述，$f$不存在。
证毕。

若良序$\lang A,R\rang$与$\lang B,S\rang$同构，则该同构映射是唯一的。
证明：
假设存在两个不同的同构映射$f,g$。根据概括公理，$S=\{y\in A\mid f(y)\neq g(y)\}$是$A$的一个非空子集。$S$有最小元$m$。对于任意$z$满足$zRm$，有$z\notin S$，从而$f(z)=g(z)$。因此集合$\{f(z) \mid z R m\}$与集合$\{g(z) \mid z R m\}$是同一个集合。
下面证明$\text{pred}(B, f(m), S) = \text{pred}(B, g(m), S)$：对于任意$b\in B$，$b \in \text{pred}(B, f(m), S)$当且仅当$bSf(m)$当且仅当存在$z\in A$使得$z R m$且$f(z) = b$（同构的定义）。而$f(z)=g(z)$，因此这当且仅当存在$z\in A$使得$z R m$且$g(z) = b$，当且仅当$bSf(m)$，当且仅当$b \in \text{pred}(B, g(m), S)$。
下面证明$f(m)=g(m)$。假设 $f(m) \neq g(m)$。因为$S$ 是全序关系，不妨设 $f(m) S g(m)$（$g(m)Sf(m)$同理）。我们有$f(m) \in \text{pred}(B, g(m), S)$。因为$\text{pred}(B, f(m), S) = \text{pred}(B, g(m), S)$，所以也有$f(m) \in \text{pred}(B, f(m), S)$。这意味着$f(m) S f(m)$，违反了反自反性。证毕。
但是$m \in S$，所以$f(m) \neq g(m)$，矛盾。
证毕。

对任意两个良序$\lang A,R\rang$与$\lang B,S\rang$，则以下三条一定恰好成立一条：
(a) $\lang A,R\rang\cong \lang B,S\rang$
(b) $\exists y\in B,\lang A,R\rang \cong \lang \text{pred}(B,y,S),S\rang$
(c) $\exists x\in A,\lang \text{pred}(A,x,S),R\rang \cong \lang B,S\rang$
这意味着，任何两个良序之间都是可以在同构的意义下互相“比较”的。
证明：
令$f=\{\lang v,w\rang\mid v\in A\land w\in B\land \lang\text{pred}(A,v,R),R\rang\cong\lang\text{pred}(B,w,S),S\rang\}$。
首先验证$f$是一个函数。对于任意$v\in A,w_1,w_2\in B$，若$\lang v,w_1\rang\in f$且$\lang v,w_2\rang\in f$，则根据 $f$ 的定义，$\lang\text{pred}(B,w_1,S),S\rang \cong \lang\text{pred}(A,v,R),R\rang \cong \lang\text{pred}(B,w_2,S),S\rang$。我们有$w_1=w_2$：假如$w_1\neq w_2$，那么不妨设$w_1Sw_2$，此时$\text{pred}(B,w_1,S)=\text{pred}(\text{pred}(B,w_2,S),w_1,S)$，由上面的第一条定理可得$\lang \text{pred}(B,w_1,S),S\rang\not\cong\lang\text{pred}(B,w_2,S),S\rang$，矛盾。
其次验证$f$是一个单射。对于任意$v_1,v_2\in A,w_1,w_2\in B$，若$\lang v_1,w_1\rang\in f$且$\lang v_2,w_2\rang\in f$，则$\lang\text{pred}(A,v_1,R),R\rang \cong \lang\text{pred}(B,w_1,S),S\rang$与$\lang\text{pred}(A,v_2,R),R\rang \cong \lang\text{pred}(B,w_2,S),S\rang$。若$w_1=w_2$，则$\lang\text{pred}(B,w_1,S),S\rang \cong \lang\text{pred}(B,w_2,S),S\rang$，因此$\lang\text{pred}(A,v_1,R),R\rang \cong \lang\text{pred}(A,v_2,R),R\rang$。同理可证$v_1=v_2$。因此$f$是单射。
下面验证$f$保持序关系，也即$\forall u,v\in \text{dom}(f),uRv\iff f(u)Sf(v)$。
	左推右：固定$u,v$满足$uRv$，则$u \in \text{pred}(A,v,R)$。设$f(v)=w$，那么$\lang\text{pred}(A,v,R),R\rang\cong\lang \text{pred}(B,w,S),S\rang$，设此同构映射为$h$。将$h$的定义限制在$\text{pred}(A,u,R)$上，记为$h'$，那么$h'$即为$\lang\text{pred}(A,u,R),R\rang$到$\lang\text{pred}(B,h(u),S),S\rang$的同构映射。根据$f$的定义，这意味着$f(u)=h(u)$。根据$uRv$，有$u\in \text{pred}(A,v,R)$，因此$h(u)\in \text{pred}(B,w,S)$，因此$h(u)Sw$。因此$f(u)Sf(v)$。
	右推左：如果$f(u)Sf(v)$，同时$\neg uRv$。由三岐性，要么$u=v$，要么$vRu$。如果$u=v$，那么$f(u)=f(v)$，与$f(u)Sf(v)$矛盾；如果$vRu$，那么$f(v)Rf(u)$，矛盾。
由此可见，$f$是$\lang\text{dom}(f),R\rang$到$\lang\text{ran}(f),S\rang$的同构映射。
下面我们证明，$f$的定义域$\text{dom}(f)$是$A$的初始线段(initial segment)，也即$\forall u,v,(uRv\land v\in \text{dom}(f))\implies u\in \text{dom}(f)$。对于任意$v\in \text{dom}(f)$，令$f(v)=w$。根据$f$的定义，存在同构映射$h$使得$\lang\text{pred}(A,v,R),R\rang \cong \lang\text{pred}(B,w,S),S\rang$。对于任意$u$满足$uRv$，将$h$的定义限制在$\text{pred}(A,u,R)$上，记为$h'$，那么$h'$即为$\lang\text{pred}(A,u,R),R\rang$到$\lang\text{pred}(B,h(u),S),S\rang$的同构映射。可见$u\in \text{dom}(f)$。
下面我们证明，$f$的值域$\text{ran}(f)$是$B$的初始线段，也即$\forall u,v,(uSv\land v\in \text{ran}(f))\implies u\in \text{ran}(f)$。对于任意$v\in \text{ran}(f)$，令$f(w)=v$。根据$f$的定义，存在同构映射$h$使得$\lang\text{pred}(A,w,R),R\rang \cong \lang\text{pred}(B,v,S),S\rang$。对于任意$u$满足$uSv$，将$h$的值域限制在$\text{pred}(B,u,S)$上，记为$h'$，那么$h'$即为$\lang\text{pred}(A,h^{-1}(u),R),R\rang$到$\lang\text{pred}(B,u,S),S\rang$的同构映射。可见$u\in \text{ran}(f)$。
在良序中，初始线段要么是全集，要么是某个元素的$\text{pred}$。因此，$\text{dom}(f)$要么是$A$，要么存在$x\in A$使得$\text{dom}(f)=\text{pred}(A,x,R)$。同理，$\text{ran}(f)$要么是$B$，要么存在$y\in B$使得$\text{ran}(f)=\text{pred}(B,y,S)$。
下面证明，不可能$\text{dom}(f) \neq A$且$\text{ran}(f) \neq B$。假设$\text{dom}(f) \neq A$且$\text{ran}(f) \neq B$，那么存在$x\in A$和$y\in B$，使得$\text{dom}(f) = \text{pred}(A,x,R)$，$\text{ran}(f) = \text{pred}(B,y,S)$。然而$f$是$\text{dom}(f)$到$\text{ran}(f)$的同构，因此$\lang \text{pred}(A,x,R), R\rang \cong \lang \text{pred}(B,y,S), S\rang$。因此$f(x)=y$，也即$x\in\text{dom}(f)$。但是$\text{dom}(f) = \text{pred}(A,x,R)$，矛盾。
因此，$\text{dom}(f)=A$和$\text{ran}(f)=B$中至少有一个成立。因此只剩下三种可能的情况：
(1) $\text{dom}(f)=A$且$\text{ran}(f)=B$：此时结论 (a) 成立；
(2) $\text{dom}(f)=A$且$\text{ran}(f) \subsetneq B$：此时存在$y\in B$使得$\text{ran}(f) = \text{pred}(B,y,S)$，结论(b)成立；
(3) $\text{dom}(f) \subsetneq A$且$\text{ran}(f)=B$：此时存在$x\in A$使得$\text{dom}(f) = \text{pred}(A,x,R)$，结论(c)成立；
最后，由我们先前证明的第一条定理，这三条结论是互斥的。
证毕。

## 公理6：无穷公理	

$\exists x(\varnothing\in x\land \forall y(y\in x\to y\cup \{y\}\in x))$

## 公理7：幂集公理

$\forall x \exists y \forall z\left( z\in y\leftrightarrow \forall w(w\in z\to w\in x)\right)$

## 公理8：Foundation公理

$\forall x(\exists y(y\in x)\to \exists y(y\in x \land \neg\exists z(z \in x\land z \in y)))$





