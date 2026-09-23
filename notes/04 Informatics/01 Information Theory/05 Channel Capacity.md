[^Date]: 2026.02.24
[^ERT ]: 33min
[^Author]: DennyQi
[^Title]: 05 Channel Capacity
[^Tag]: Informatics, Information Theory

## Information Channel

信息是消息(message)的概率分布，消息是物质按照特定结构的排列。所谓“通信(communication)”就是把某一时间地点的某一物质排列在另一个时间地点再现，也就是消息的传递。要完成消息的传递，需要实现一个物理系统，这个用来传递消息的物理的系统就称为信道(channel)。在物理世界中建立信道传递消息，不可避免地会受到干扰。信息论的最重要的问题之一，就是如何在信道受到干扰的情况下准确、高效地传递信息。

<img src="C:\Users\DennyQi\AppData\Roaming\Typora\typora-user-images\image-20260223171339715.png" alt="image-20260223171339715" style="zoom:25%;" />

让我们先来看一个最简单的信道。这个信道单位时间只能发送$0$或$1$两种字符，每种字符都有$f$的概率会受到干扰变成另一种字符。这称为一个二进制对称信道。上面是一个用$f=0.1$的二进制对称信道发送黑白像素图片的示例，可以看到图片受到干扰后出现了很多噪点，但是其基本轮廓依然清晰可见。这就是物理世界里受干扰的信道传输消息的现实状况。

为了降低信道所受的干扰，人们可以选择加强信道的物理系统。例如，增强用于储存信息和传送信息的磁场强度，以降低信息受到干扰的概率（也就是上面的$f$）。让我们把这类方法统称为物理方法，这不是信息论要讨论的对象。信息论要讨论的是不改变信道的物理构造的前提下，是否存在算法层面(computational)的方法，来提高信道传递信息的效率和准确率。

例如，我们容易想到这样一个算法层面的方法来提高二进制对称信道的准确率：对于每个待发送的二进制位，用该信道重复发送$n$遍，接收方通过观察收到的$n$个二进制位中$0$多还是$1$多来确定原始发送的二进制位是什么。容易想象，当$n$非常大的时候，这种做法的准确率是极高的。不过，$n$越大，我们就要做越多的重复发送，因此信道的效率就越低。可见信道的准确率和效率是一对互相牵制的矛盾。

所有用以增强信道准确率的算法设计基本都可以总结为下图。对于原始要发送的消息$s$，首先要经过一个encoder编码为$t$，这对应于上面“把一个位重复发送$n$遍”的操作。把编码后的消息$t$用信道传送，接收方再通过decoder解码出$\hat s$，这对应于我们上面“通过判断哪种字符多来还原原始字符”的操作。

> Remark: 在这里encoder的作用是为待发送的消息增加冗余信息，以提高其抵抗干扰的能力。这与信息压缩相反，信息压缩尽量去除信息冗余，而信道编码增加信息冗余。

<img src="C:\Users\DennyQi\AppData\Roaming\Typora\typora-user-images\image-20260223172159699.png" alt="image-20260223172159699" style="zoom:45%;" />

下图是用上面的“重发$n$次”算法发送黑白像素图片的示例：

<img src="C:\Users\DennyQi\AppData\Roaming\Typora\typora-user-images\image-20260223173512706.png" alt="image-20260223173512706" style="zoom:47%;" />

可以看到，相比于直接发送，噪点减少了许多。当然，这消耗了我们更多的算力。原本一个二进制位受干扰而出错的概率是$f$。让我们来计算一下“重发$n$次”算法下一个二进制位的出错概率。不妨设$n$为计数，decoder解得的$\hat s\neq s$当且仅当$n$次重发中有至少$(n+1)/2$次出错，因此总的出错概率为$\sum\limits_{k=(n+1)/2}^{n}\dbinom{n}{k}f^k(1-f)^{n-k}$。当$n=3,f=0.1$时，代入可得出错概率为$0.028$。

再来看另一个信道编码算法，这个算法称为$(7,4)$-海明码(Hamming Code)。“重发$n$次”的算法是对于待发送的源码按单个位进行编码后发送的，而新的这个算法会把源码$4$个位一组打包后编码发送。编码方式如下图所示，对于待发送的源码串$s_1s_2s_3s_4$，计算二进制不进位加法$t_5=s_1+s_2+s_3$，$t_6=s_2+s_3+s_4$，$t_7=s_1+s_3+s_4$（相当于“奇偶校验”），将这三位附加在源码后，生成$7$位的编码。例如，当$s=1000$时，编码得到$t=1000101$。接下来我们需要设计一个解码算法。把decoder接收到的$7$位串也放进这三个圈里。首先注意到，一个未受干扰的$7$位串一定满足每个圈内求和为偶数。不过，每个圈内求和为偶数并不意味着其未受干扰，因为可能同时有多个位受干扰。根据每个圈是否受到干扰，共有$2^3=8$种可能情况。不难发现，对于每种情况，一定存在一个位恰好属于所有受干扰的圈，且不属于所有未受干扰的圈。只需对这样的一个位做取反操作，立即能得到一个每个圈求和都为$0$的$7$位串$\hat s$。我们就把此作为解码算法。例如，若$r=1100101$，解码得到$\hat s=1000101$；若$r=1101101$，解码得到$\hat s=0101101$。

<img src="C:\Users\DennyQi\AppData\Roaming\Typora\typora-user-images\image-20260223174949318.png" alt="image-20260223174949318" style="zoom:50%;" />

对于上面这个解码算法来说，如果恰好只有一位受干扰，那么解码算法一定正确。然而如果不止一位受干扰，那么解码算法一定错误，因为解码结果只会改变接收到的串中的一位。由此可见，如果每一位都用$f$-二进制对称信道发送，那么发送一个$4$位包的出错概率就是$\sum\limits_{k=2}^{7}\dbinom{7}{k}f^k(1-f)^{7-k}$。分摊到每一位上，出错概率是$O(f^2)$级别的，和“重发$n$次”算法的出错概率数量级相同。然而，相比于“重发$n$次”算法，我们增加的冗余只占到源码的$3/7$，效率提高了许多。

海明码可以从$3$维推广到$n$维，也就是$(2^n-1-n,2^n-1)$-海明码。随着$n$的增大，其冗余比越来越低，但是出错概率却越来越高：无论$n$多大，海明码对于每个块只会纠一个错，所以分摊到每一位上的出错概率随$n$指数增大，正比于块的长度。

信息论关心的问题是，一个最好的信道编码算法能做到什么程度？我们已经通过上面两个例子看到“错误率”和“效率”是一对互相牵制的因素，要使得错误率越低，效率也会越低。人们之前一直以为即便是最好的编码算法，要使得错误率趋向$0$，信道的效率也会趋向$0$。然而香农(Shannon)证明了，当错误率趋向$0$时，效率可以趋向一个常数值，这个常数值就被称为这个信道的“容量(capacity)”。这就是信息论中最著名的信道编码定理。

---

“通信”到底是什么？严格地说，当我们说$A$与$B$通信时，我们指的是$A$通过一些物理作用改变了$B$的物理状态。在这个物理作用的过程中，完成了信息的传递。<u>我们之所以要讨论通信，是因为物理世界的复杂性导致在信息传输过程中，噪声(noise)干扰导致的信息损失是不可避免的</u>。某种意义上，信息传输和信息编码是一种相反的过程。对于编码来说，一个长度为$n$的随机二进制串的信息量总是不超过$\log n$，这是因为随机变量的分布中存在冗余；而在信息传输中，由于干扰的存在，我们总是需要传输比信息量更多的位数才能保证消息被准确无误地接收到。在信息论中，我们定义信道(Channel)来描述这个信息传递的过程。在信道中，$A$要传递某个消息，那么它首先要用字符集$\mathcal{X}$把这个消息编码成某个长度为$n$的字符串$X^n$。接着，这个信息要经过信道传送到$B$。在传送的过程中，$X^n$受到噪声干扰以至于$B$在接受信息时得到的是某个字符集$\mathcal{Y}$的某个长度同样为$n$的字符串$Y^n$。当$B$把$Y^n$转译成能够理解的形式以后，信息传递的过程就完成了。

从以上信息传输的过程中我们能看到，信息传递的准确性就取决于由$X^n$转变成$Y^n$的过程。为此，我们可以用一个概率分布$p(y^n\mid x^n)$来刻画信道。如果$\mathcal{X},\mathcal{Y}$都是有限的，我们就称它为一个离散信道(Discrete Channel)。如果$p(y^n\mid x^n)=\prod\limits_{i=1}^{n}p(y_i\mid x_i)$，就称为离散无记忆信道(Discrete Memoryless Channel)，记为$(\mathcal{X},p(y\mid x),\mathcal{Y})$。

假设总共有$M$条可以被传输的信息。对于任何一个待传输的信息，我们总可以把它和一个自然数$i$对应起来，$i\in \{1,\cdots,M\}$。设把$i$映射成$x^n$的映射(encoder)为$f$，把$y^n$映射到自然数的映射(decoder)为$g$。那么定义出错的条件概率(Conditional Probability of Error)为$\lambda_i=\Pr[g(Y^n)\neq i\mid f(i)=X^n]$。根据全概率公式，这等价于$\sum\limits_{y^n}p(y^n\mid x^n(i))\cdot \mathbb{1}[g(y^n)\neq i]$。把可能的最大的出错概率记为$\lambda^{(n)}=\max\limits_{i\in[M]}\lambda_i$，平均的出错概率记为$P_e^{(n)}=\dfrac{1}{M}\sum\limits_{i\in[m]}\lambda_i$。

注意，当我们假定$M$以后，意味着信道只可能发送$M$条不同的信息。这意味着，即使我们什么也不发送，接收者也知道一旦发送，它也只会收到这$M$条中的某一条。如果我们假设所有消息被发送的概率是相等的，这意味着一条消息的不确定性（信息量，熵）就是$\log M$。而为了传递这条消息，我们将会传输字符$n$次，因此我们称这次传输的码率（rate，单位是bit）为$R=\dfrac{\log M}{n}$。这反应的是本次传输中每传输一个字符时平均而言传递了多少信息量，在均匀分布的前提下，码率为$R$意味着一个字符传输$2^R$的信息量。自然地，一个信道受干扰越多码率就会越低。一个信道在传递信息时产生的码率变化情况既与我们传输信息的方案有关，也和信道本身受到的干扰有关。假如我们总是以最好的方式传输信息，那么平均而言（大数定律意义下）一个特定的信道总有一个能够实现的最大的码率，这个最大的码率完全是由信道本身的性质决定的，对于离散无记忆信道而言，这就是由矩阵$p(y\mid x)$决定的。对于一个信道，如果以码率$R$传输$n$位，总的信息量为$(2^R)^n=2^{nR}$。如果这个信道用长度为$n$的$X^n$传递$M=\left\lceil 2^{nR}\right\rceil$（由于可能不为整数，我们做上取整）的消息时，能在$n\to\infty$时实现最大出错概率$\lambda^{(n)}\to0$，就称码率$R$是可实现的(achievable)。所有可实现的$R$的上确界定义为该信道的容量(Capacity)。

## Channel Coding Theorem(信道编码定理)

Shannon在1948的论文中提出，离散无记忆信道$(\mathcal{X},p(y\mid x),\mathcal{Y})$的信道容量$C=\max\limits_{p(x)}I(X;Y)$。这称为信道编码定理，是信息论中最重要也最基础的定理。它指出，信道容量恰好等于$I(X;Y)$随输入分布$p(x)$变化的上确界。同时，任何一个$R<C$的码率都是可实现的，也即存在$M=\left\lceil 2^{nR}\right\rceil$的长度为$n$的编码在$n\to\infty$时最大出错概率趋向0；反之，任何可实现的码率都必定满足$R\leq C$。我们看到，这也为互信息这一概念提供了一种具体的意义。为什么会出现互信息？我们在渐进均分性下考虑这个问题。由于噪声的存在，可能有多个不同的$x^n$受到干扰后落在了同一个$y^n$上。信道的容量等价于接收者最多可以区分多少个不同的$x^n$。$Y^n$的典型集中共有$2^{nH(Y)}$个字符串，而给定$X$我们只能知道$y^n$落在对应的$2^{nH(Y\mid X)}$个字符串中，而不知道是具体哪一个。为了能够清楚区分所有$x^n$，我们选取一个$x^n$来对应这样的$y^n$。因此，我们最多只能分辨$\dfrac{2^{nH(Y)}}{2^{nH(Y\mid X)}}$个字符串，也即$2^{n(H(Y)-H(Y\mid X))}=2^{nI(X;Y)}$条不同的消息。因此码率不可能超过$\dfrac{\log 2^{nI(X;Y)}}{n}=I(X;Y)\leq C$。

对于任意固定的$R$，其中$R<C$，我们可以构造一个$M=\left\lceil 2^{nR}\right\rceil$的消息集使得$n\to\infty$时$\lambda^{(n)}\to 0$。我们任意固定一个输入上的分布$p(x)$（$x$有$M$个可能取值），用这个分布随机<u>生成$M$个</u>长度为$n$的字符串$x^n$，记为矩阵$\mathcal{C_p}$。生成这样的特定的$M$个字符串的概率为$\Pr(\mathcal{C}_p)=\prod\limits_{w=1}^{M}\prod\limits_{i=1}^{n}p(x_w^{(i)})$。当我们要发送第$w$条消息时，我们就用信道传输字符串$x_w^n$。接收者此时为收到一条经过干扰的字符串$y^n$。接收者采用这样一种基于渐进均分性的简单的解码策略：他认为$y^n$应当解码为$\hat x^n$，当且仅当$\hat x^n$是$X^n$中唯一一个使得$(\hat x^n,y^n)$落在$(X^n,Y^n)$的联合典型集里的。在这样的编码和解码策略下，我们可以证明最大出错概率趋向0，此处省略。

反之，我们要说明任何一个可实现的码率都不超过$C$。对于给定的$R$，如果存在$M=\left\lceil 2^{nR}\right\rceil$的消息集使得$n\to\infty$时$\lambda^{(n)}\to 0$，那么设待发送的消息为$W$，它将被加密为$X^n$，经过传输得到$Y^n$，再被接收方解码为$\hat W$。于是我们有马尔可夫链$W\to X^n\to Y^n\to\hat W$。假设$W$是均匀选取的，那么$H(W)=\log M= nR$（忽略上取整）。根据韦恩图，总是成立$H(W)=H(W\mid \hat W)+I(W;\hat W)$。根据Fano不等式（见下方注释），$H(W\mid \hat W)\leq 1+P_e^{(n)}\cdot \log |\mathcal{W}|= 1+P_e^{(n)}\cdot nR$。而又根据Data Processing不等式，$I(W;\hat W)\leq I(X^n;Y^n)=H(Y^n)-H(Y^n\mid X^n)$ $=H(Y^n)-H(Y_1,\cdots,Y_n\mid X_1,\cdots,X_n)=H(Y^n)-\sum\limits_{i=1}^{n}H(Y_i\mid X_1,\cdots,X_n,Y_1,\cdots,Y_{i-1})$ $=H(Y_1,\cdots,Y_n)-\sum\limits_{i=1}^{n}H(Y_i\mid X_i)\leq \sum\limits_{i=1}^{n}H(Y_i)-\sum\limits_{i=1}^{n}H(Y_i\mid X_i)$ $=\sum\limits_{i=1}^{n}I(X_i;Y_i)\leq nC$。综上，$nR\leq 1+P_e^{(n)}\cdot nR+nC$，也就是说$R\leq\dfrac{1}{n}+P_e^{(n)}\cdot R+C$。当$n\to \infty$时，$\dfrac 1 n\to 0,P_e^{(n)}\to 0$，因此成立$R\leq C$。 

> ## Fano's Inequality
>
> 假设$X,Y$是两个随机变量。我们给出一个基于$Y$预测$X$的函数$g(Y)=\hat X$，计算预测错误的概率$\Pr[X\neq \hat X]$。
>
> 记$E=\mathbb{1}[X\neq \hat X]$。$H(E,X\mid \hat X)=H(X\mid \hat X)+H(E\mid X,\hat X)$，而$E$是由$X,\hat X$定义的函数，因此$H(E\mid X,\hat X)=0$。又有$H(E,X\mid \hat X)=H(E\mid \hat X)+H(X\mid E,\hat X)$。同时，$H(E\mid \hat X)\leq H(E)$。根据条件熵的定义，$H(X\mid E,\hat X)=\Pr[E=0]H(X\mid E=0,\hat X)+\Pr[E=1]H(X\mid E=1,\hat X)$。当$E=0$时，已知$\hat X$就是已知$X$，因此$H(X\mid E=0,\hat X)=0$；当$E=1$时，$H(X\mid E=1,\hat X)\leq H(X)\leq \log |\mathcal{X}|$。综上得到$H(X\mid \hat X)\leq H(E)+Pr[X\neq \hat X]\log |\mathcal{X}|$。这就是Fano不等式。
>
> 我们注意到，$X\to Y\to \hat X$形成了马尔可夫链。根据数据处理不等式有$H(X\mid \hat X)\geq H(X\mid Y)$。同时，$H(E)\leq \log 2=1$，所以Fano不等式可以弱化为$1+\Pr[X\neq \hat X]\log |\mathcal{X}|\geq H(X\mid Y)$。化简得$\Pr[X\neq \hat X]\geq \dfrac{H(X\mid Y)-1}{\log|\mathcal{X}|}$。
>
> 事实上，在$H(X\mid E=1,\hat X)\leq H(X)\leq \log |\mathcal{X}|$这一步放缩中，由于$E=1$，$X$实际上只有$|\mathcal{X}|-1$个取值。所以可以得到一个更紧的界$\log (|\mathcal{X}|-1)$。所以Fano不等式更强的形式是$\Pr[X\neq \hat X]\geq \dfrac{H(X\mid Y)-1}{\log(|\mathcal{X}|-1)}$。





> 写了一半不想写的：的出错概率。我们先让分布$p(x)$变化，计算平均出错概率的期望：$\Pr(\mathcal{E})=\sum\limits_{\mathcal{C}_p}\Pr(\mathcal{C}_p)P_e^{(n)}(\mathcal{C}_p)$，代入$P_e^{(n)}=\dfrac{1}{M}\sum\limits_{w\in[m]}\lambda_w(\mathcal{C}_p)$得$\Pr(\mathcal{E})=\dfrac{1}{M}\sum\limits_{w=1}^{M}\sum\limits_{\mathcal{C}_p}\Pr(\mathcal{C}_p)\lambda_w(\mathcal{C}_p)$。由于我们是对任意$\mathcal{C_p}$求和，而$\mathcal{C_p}$的每一个字符串都是随机生成的，所以$\lambda_w$的下标取不同的值并没有实际的影响，可以认为下标恒取$1$。因此$\Pr(\mathcal{E})=\sum\limits_{\mathcal{C}_p}\Pr(\mathcal{C}_p)\lambda_1(\mathcal{C}_p)=\Pr(\mathcal{E}\mid W=1)$。也即在计算时，我们可以认为我们始终发送第一条随机生成的字符串。于是，只有以下情况可能出错：$x_1^n$与$y^n$不在典型集里；存在$i>1$使得$x_i^n$与$y^n$在典型集中。由于我们总是发送第一条字符串，所以$y^n$其实是与任何$x_i^n$都独立的。根据联合AEP，$\Pr[(x_i^n,y^n)\in A_\epsilon^{(n)}]=\sum\limits_{(x_i^n,y^n)\in A_\epsilon^{(n)}}p(x_i^n)p(y^n)$ $\leq |A_\epsilon^{(n)}|2^{-n(H(X)-\epsilon)}2^{-n(H(Y)-\epsilon)}\leq 2^{n(H(X,Y)+\epsilon)}2^{-n(H(X)-\epsilon)}2^{-n(H(Y)-\epsilon)}$ $=2^{-n(I(X;Y)-3\epsilon)}$。因此对于足够大的$n$，第一种出错概率不超过



## 参考资料

[1] Thomas M. Cover, Joy A. Thomas, *Elements of Information Theory*

[2] David J.C. MacKay, *Information Theory, Inference, and Learning Algorithms*









